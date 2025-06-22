# routing.py
import uuid
import pandas as pd
import io
from typing import List

from fastapi import (APIRouter, Form, Request, WebSocket,
                     WebSocketDisconnect, UploadFile, File, HTTPException)
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, StreamingResponse
from fastapi.templating import Jinja2Templates

from storage import QuizSession, storage
from utils import generate_session_code
from connection import manager
from event_handler import process_event, handle_disconnect, broadcast_state
from question_bank import (
    add_question_to_bank,
    get_all_questions,
    delete_question_from_bank,
    search_questions_by_tags,
    get_all_tags
)
from quiz_history import quiz_history_storage

router = APIRouter()
templates = Jinja2Templates(directory="templates")


# --- HTTP Endpoints ---

@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/create", response_class=HTMLResponse)
async def create_quiz_page(request: Request):
    questions = await get_all_questions()
    return templates.TemplateResponse("create.html", {"request": request, "question_bank": questions})


@router.get("/history", response_class=HTMLResponse)
async def quiz_history_page(request: Request):
    """Display quiz history page."""
    quizzes = await quiz_history_storage.get_quiz_history(limit=20)
    return templates.TemplateResponse("history.html", {"request": request, "quizzes": quizzes})


@router.get("/api/history")
async def api_get_history():
    """API endpoint to get quiz history."""
    quizzes = await quiz_history_storage.get_quiz_history(limit=20)
    # BSON/Mongo's ObjectId is not directly JSON serializable
    for quiz in quizzes:
        if "_id" in quiz:
            quiz["_id"] = str(quiz["_id"])
    return quizzes


@router.post("/api/create_quiz")
async def api_create_quiz(request: Request):
    """API endpoint to create a new quiz session."""
    form_data = await request.form()
    
    # --- Get quiz name ---
    quiz_name = form_data.get("quiz_name", "Unnamed Quiz")
    
    # --- Get timer value ---
    timer_value = form_data.get("timer")
    timer_seconds = int(timer_value) if timer_value else 30

    # --- Check for questions from the bank ---
    selected_question_ids = form_data.getlist("question_bank_ids")
    
    # Fetch all questions from the bank once
    all_bank_questions = await get_all_questions()
    bank_questions_map = {q["hash"]: q for q in all_bank_questions}

    quiz_questions = []

    # Add selected questions from the bank
    for q_hash in selected_question_ids:
        if q_hash in bank_questions_map:
            question = bank_questions_map[q_hash]
            quiz_questions.append({
                "text": question["text"],
                "options": question["options"],
                "answers": {opt: 0 for opt in question["options"]},
                "correct_answer": question["correct_answer"]
            })

    # --- Process manually added questions ---
    manual_questions = form_data.getlist("questions")
    manual_options = form_data.getlist("options")
    manual_tags = form_data.getlist("manual_tags")  # Get tags for manual questions
    
    # Get correct answers for manually added questions
    manual_correct_answers = []
    i = 1
    while f"correct_answer_q{i}" in form_data:
        manual_correct_answers.append(form_data[f"correct_answer_q{i}"])
        i += 1

    options_per_question = 4
    grouped_manual_options = [manual_options[i:i + options_per_question] for i in range(0, len(manual_options), options_per_question)]

    for i, q_text in enumerate(manual_questions):
        if i < len(grouped_manual_options) and i < len(manual_correct_answers):
            opts = grouped_manual_options[i]
            correct_answer = manual_correct_answers[i]
            
            # Get tags for this question (if available)
            question_tags = []
            if i < len(manual_tags) and manual_tags[i].strip():
                question_tags = [tag.strip().lower() for tag in manual_tags[i].split(',') if tag.strip()]
            
            question_data = {
                "text": q_text,
                "options": opts,
                "answers": {opt: 0 for opt in opts},
                "correct_answer": correct_answer,
                "tags": question_tags
            }
            quiz_questions.append(question_data)

    # If no questions were selected or added, handle error (e.g., redirect back)
    if not quiz_questions:
        # Redirect back to create page with an error message, or just back
        return RedirectResponse(url="/create", status_code=303)
        
    session_code = generate_session_code()
    while await storage.session_exists(session_code):
        session_code = generate_session_code()

    quiz_data: QuizSession = {
        "presenter": None,
        "state": "LOBBY",
        "current_question_index": -1,
        "questions": quiz_questions,
        "players": {},
        "timer": timer_seconds,
        "question_start_time": 0.0,
        "quiz_name": quiz_name,
        "quiz_start_time": None
    }
    await storage.save_session(session_code, quiz_data)

    accept_header = request.headers.get('accept', '')
    if 'application/json' in accept_header:
        return JSONResponse(content={'session_code': session_code})
    return RedirectResponse(url=f"/presenter/{session_code}", status_code=303)


@router.get("/presenter/{session_code}", response_class=HTMLResponse)
async def presenter_view(request: Request, session_code: str):
    if not await storage.session_exists(session_code):
        return HTMLResponse("Quiz not found", status_code=404)
    return templates.TemplateResponse("presenter.html", {"request": request, "session_code": session_code})


@router.get("/join/{session_code}", response_class=HTMLResponse)
async def audience_view(request: Request, session_code: str):
    if not await storage.session_exists(session_code):
        return HTMLResponse("Quiz not found", status_code=404)
    return templates.TemplateResponse("index.html", {"request": request, "session_code": session_code})


# --- Question Bank Endpoints ---

@router.get("/question-bank", response_class=HTMLResponse)
async def question_bank_page(request: Request):
    questions = await get_all_questions()
    tags = await get_all_tags()
    return templates.TemplateResponse("question_bank.html", {"request": request, "questions": questions, "tags": tags})

@router.get("/api/question-bank")
async def api_get_question_bank(tags: str = None):
    """API endpoint to get all questions from the bank with optional tag filtering."""
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        questions = await search_questions_by_tags(tag_list)
    else:
        questions = await get_all_questions()
    return questions

@router.get("/api/question-bank/tags")
async def api_get_tags():
    """API endpoint to get all available tags."""
    tags = await get_all_tags()
    return tags

@router.post("/api/question-bank/add")
async def api_add_question(
    request: Request,
    question_text: str = Form(...),
    option1: str = Form(...),
    option2: str = Form(...),
    option3: str = Form(...),
    option4: str = Form(...),
    correct_answer: str = Form(...),
    tags: str = Form("")
):
    options = [option1, option2, option3, option4]
    
    # Parse tags from comma-separated string
    tag_list = []
    if tags.strip():
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
    
    await add_question_to_bank(question_text, options, correct_answer, tag_list)
    accept_header = request.headers.get('accept', '')
    if 'application/json' in accept_header:
        return JSONResponse(content={'status': 'ok'})
    return RedirectResponse(url="/question-bank", status_code=303)

@router.post("/api/question-bank/delete/{question_hash}")
async def api_delete_question(request: Request, question_hash: str):
    await delete_question_from_bank(question_hash)
    accept_header = request.headers.get('accept', '')
    if 'application/json' in accept_header:
        return JSONResponse(content={'status': 'ok'})
    return RedirectResponse(url="/question-bank", status_code=303)


# --- WebSocket Endpoint ---

@router.websocket("/ws/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str):
    if not await storage.session_exists(session_code):
        await websocket.close(code=1008)
        return

    player_id = str(uuid.uuid4())
    await manager.connect(websocket, session_code, player_id)
    
    # On first connect, broadcast initial state
    await broadcast_state(session_code)

    try:
        while True:
            data = await websocket.receive_text()
            await process_event(session_code, player_id, data)
    except WebSocketDisconnect:
        await handle_disconnect(session_code, player_id)


# --- File Upload Endpoints ---

@router.get("/upload-questions", response_class=HTMLResponse)
async def upload_questions_page(request: Request):
    """Display the upload questions page."""
    return templates.TemplateResponse("upload_questions.html", {"request": request})

@router.get("/api/download-template")
async def download_template():
    """Download CSV template for questions."""
    import csv
    from fastapi.responses import StreamingResponse
    
    # Create template data
    template_data = [
        ["Question", "Option1", "Option2", "Option3", "Option4", "CorrectAnswer", "Tags"],
        ["What is the capital of France?", "London", "Berlin", "Paris", "Madrid", "Paris", "geography,capitals"],
        ["Which planet is closest to the Sun?", "Venus", "Mercury", "Earth", "Mars", "Mercury", "science,astronomy"],
        ["What is 2 + 2?", "3", "4", "5", "6", "4", "math,basic"]
    ]
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(template_data)
    
    # Create response
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=questions_template.csv"}
    )

@router.post("/api/upload-questions")
async def upload_questions(file: UploadFile = File(...)):
    """Upload questions from CSV or Excel file."""
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Check file extension
    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse based on file type
        if file_extension == 'csv':
            df = pd.read_csv(io.BytesIO(content))
        else:  # Excel file
            df = pd.read_excel(io.BytesIO(content))
        
        # Validate required columns
        required_columns = ['Question', 'Option1', 'Option2', 'Option3', 'Option4', 'CorrectAnswer']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process questions
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Extract data
                question_text = str(row['Question']).strip()
                options = [
                    str(row['Option1']).strip(),
                    str(row['Option2']).strip(),
                    str(row['Option3']).strip(),
                    str(row['Option4']).strip()
                ]
                correct_answer = str(row['CorrectAnswer']).strip()
                tags = str(row.get('Tags', '')).strip()
                
                # Validate data
                if not question_text or question_text == 'nan':
                    continue
                
                if not all(options) or any(opt == 'nan' for opt in options):
                    errors.append(f"Row {index + 1}: Invalid options")
                    error_count += 1
                    continue
                
                if not correct_answer or correct_answer == 'nan':
                    errors.append(f"Row {index + 1}: Missing correct answer")
                    error_count += 1
                    continue
                
                if correct_answer not in options:
                    errors.append(f"Row {index + 1}: Correct answer must be one of the options")
                    error_count += 1
                    continue
                
                # Parse tags
                tag_list = []
                if tags and tags != 'nan':
                    tag_list = [tag.strip().lower() for tag in tags.split(',') if tag.strip()]
                
                # Add to question bank
                result = await add_question_to_bank(question_text, options, correct_answer, tag_list)
                
                if "error" not in result:
                    success_count += 1
                else:
                    errors.append(f"Row {index + 1}: {result['error']}")
                    error_count += 1
                    
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
                error_count += 1
        
        return {
            "success": True,
            "message": f"Upload completed. {success_count} questions added successfully, {error_count} errors.",
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}") 