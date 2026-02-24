"""Request/response and context Pydantic models for the AI service API."""

from pydantic import BaseModel, Field


class WeddingContext(BaseModel):
    id: int
    name: str
    date: str | None = None
    venue_name: str | None = None


class GuestContext(BaseModel):
    id: int | None = None
    name: str
    email: str | None = None
    phone: str | None = None
    plus_one_count: int = 0
    dietary_notes: str | None = None


class TaskContext(BaseModel):
    id: int | None = None
    title: str
    status: str | None = None
    priority: str | None = None


class GuestbookEntryContext(BaseModel):
    id: int | None = None
    guest_name: str
    message: str
    is_public: bool = True


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    wedding: WeddingContext
    guests: list[GuestContext] = Field(default_factory=list)
    tasks: list[TaskContext] = Field(default_factory=list)
    guestbook_entries: list[GuestbookEntryContext] = Field(default_factory=list)


class AskResponse(BaseModel):
    answer: str
    model: str
    context_summary: str | None = None


class AskDocsRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
