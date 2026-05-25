from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import auth_router, contacts_router, links_router, notes_router, uploads_router

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

if settings.frontend_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.frontend_origins],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"message": exc.detail, "status": exc.status_code}},
    )


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"message": "Validation error", "details": exc.errors()}},
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def include_api_routes(prefix: str = "") -> None:
    app.include_router(auth_router, prefix=prefix)
    app.include_router(notes_router, prefix=prefix)
    app.include_router(contacts_router, prefix=prefix)
    app.include_router(links_router, prefix=prefix)
    app.include_router(uploads_router, prefix=prefix)


include_api_routes("")
if settings.api_v1_prefix and settings.api_v1_prefix != "/":
    include_api_routes(settings.api_v1_prefix)

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")
