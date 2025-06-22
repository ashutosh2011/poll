# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routing import router

app = FastAPI()

# --- CORS Middleware ---
# This is the new section you need to add.
# It allows requests from any origin, which is useful for development.
# For production, you would want to restrict this to your actual frontend's domain.
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------

# Mount static files (for CSS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include all the routes from routing.py
app.include_router(router)