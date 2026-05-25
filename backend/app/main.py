"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.config import settings
from app.routers import auth as auth_router
from app.routers import contacts as contacts_router
from app.routers import links as links_router
from app.routers import notes as notes_router
from app.routers import uploads as uploads_router
from app.utils.logging import configure_logging


logger = logging.getLogger("satosave")


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging("DEBUG" if settings.app_debug else "INFO")
    logger.info(
        "Starting %s in %s mode (debug=%s)",
        settings.app_name,
        settings.app_env,
        settings.app_debug,
    )
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="Encrypted personal vault for notes, contacts and links.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount(
        f"/{settings.upload_dir}",
        StaticFiles(directory=str(settings.upload_path)),
        name="uploads",
    )

    app.include_router(auth_router.router)
    app.include_router(notes_router.router)
    app.include_router(contacts_router.router)
    app.include_router(links_router.router)
    app.include_router(uploads_router.router)

    @app.get("/", tags=["meta"])
    def root() -> dict[str, str]:
        return {"app": settings.app_name, "status": "ok"}

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(ValidationError)
    async def _pydantic_error_handler(
        _: Request, exc: ValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()},
        )

    @app.exception_handler(HTTPException)
    async def _http_error_handler(_: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers or None,
        )

    return app


app = create_app()
