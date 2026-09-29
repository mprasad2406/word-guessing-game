"""Add public_id UUID column to game_sessions and backfill existing rows

Revision ID: 0004_game_public_id
Revises: 0003_guesses_and_hints
Create Date: 2026-09-29 10:30:00.000000

"""
import uuid
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0004_game_public_id'
down_revision: Union[str, None] = '0003_guesses_and_hints'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add public_id column as nullable initially
    op.add_column('game_sessions', sa.Column('public_id', sa.String(length=36), nullable=True))

    # 2. Backfill existing game_sessions with unique UUIDv4 values
    connection = op.get_bind()
    game_sessions_table = sa.table(
        'game_sessions',
        sa.column('id', sa.Integer),
        sa.column('public_id', sa.String),
    )

    results = connection.execute(sa.select(game_sessions_table.c.id)).fetchall()
    for row in results:
        session_id = row[0]
        generated_uuid = str(uuid.uuid4())
        connection.execute(
            game_sessions_table.update()
            .where(game_sessions_table.c.id == session_id)
            .values(public_id=generated_uuid)
        )

    # 3. Alter column to NOT NULL and add UNIQUE constraint & index
    op.alter_column('game_sessions', 'public_id', existing_type=sa.String(length=36), nullable=False)
    op.create_index(op.f('ix_game_sessions_public_id'), 'game_sessions', ['public_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_game_sessions_public_id'), table_name='game_sessions')
    op.drop_column('game_sessions', 'public_id')
