from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Link, User
from app.schemas.vault import LinkCreate, LinkOut, LinkUpdate
from app.security.dependencies import get_current_user
from app.services.vault import encrypted, ensure_upload_owner, get_owned_link, link_to_out, list_links

router = APIRouter(prefix="/links", tags=["links"])


@router.get("", response_model=list[LinkOut])
def index(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[LinkOut]:
    return list_links(db, user)


@router.post("", response_model=LinkOut, status_code=status.HTTP_201_CREATED)
def create(payload: LinkCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> LinkOut:
    ensure_upload_owner(db, payload.image_file_id, user.id)
    link = Link(user_id=user.id, encrypted_title=encrypted(payload.title), encrypted_url=encrypted(str(payload.url)), encrypted_description=encrypted(payload.description), image_file_id=payload.image_file_id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link_to_out(link)


@router.get("/{link_id}", response_model=LinkOut)
def show(link_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> LinkOut:
    return link_to_out(get_owned_link(db, link_id, user))


@router.patch("/{link_id}", response_model=LinkOut)
def update(link_id: str, payload: LinkUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> LinkOut:
    link = get_owned_link(db, link_id, user)
    if payload.image_file_id is not None:
        ensure_upload_owner(db, payload.image_file_id, user.id)
        link.image_file_id = payload.image_file_id
    if payload.title is not None:
        link.encrypted_title = encrypted(payload.title)
    if payload.url is not None:
        link.encrypted_url = encrypted(str(payload.url))
    if payload.description is not None:
        link.encrypted_description = encrypted(payload.description)
    db.commit()
    db.refresh(link)
    return link_to_out(link)


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def destroy(link_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> Response:
    link = get_owned_link(db, link_id, user)
    db.delete(link)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
