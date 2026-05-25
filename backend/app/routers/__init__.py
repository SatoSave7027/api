from app.routers.auth import router as auth_router
from app.routers.contacts import router as contacts_router
from app.routers.links import router as links_router
from app.routers.notes import router as notes_router
from app.routers.uploads import router as uploads_router

__all__ = ["auth_router", "contacts_router", "links_router", "notes_router", "uploads_router"]
