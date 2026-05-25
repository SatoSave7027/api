import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, notes, contacts, links, uploads

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory ready: {upload_path.resolve()}")
    yield
    logger.info("Application shutting down")


app = FastAPI(
    title="SatoSave Vault API",
    description="Secure personal data vault - notes, contacts, links",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=str(upload_path)),
    name="uploads",
)

app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(contacts.router)
app.include_router(links.router)
app.include_router(uploads.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SatoSave Vault API"}
