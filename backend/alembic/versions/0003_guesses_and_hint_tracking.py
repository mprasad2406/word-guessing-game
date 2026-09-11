"""Guesses and hint tracking migration

Revision ID: 0003_guesses_and_hint_tracking
Revises: 0002_game_foundation_and_admin_settings
Create Date: 2026-09-11 14:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_guesses_and_hints'
down_revision: Union[str, None] = '0002_game_and_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add hints_used and hint_revealed to game_sessions
    op.add_column('game_sessions', sa.Column('hints_used', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('game_sessions', sa.Column('hint_revealed', sa.Boolean(), nullable=False, server_default=sa.false()))

    # 2. Create guesses table
    op.create_table(
        'guesses',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('game_session_id', sa.Integer(), nullable=False),
        sa.Column('guess', sa.String(length=50), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('attempt_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['game_session_id'], ['game_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('game_session_id', 'attempt_number', name='uq_game_session_attempt')
    )
    op.create_index(op.f('ix_guesses_id'), 'guesses', ['id'], unique=False)
    op.create_index(op.f('ix_guesses_game_session_id'), 'guesses', ['game_session_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_guesses_game_session_id'), table_name='guesses')
    op.drop_index(op.f('ix_guesses_id'), table_name='guesses')
    op.drop_table('guesses')

    op.drop_column('game_sessions', 'hint_revealed')
    op.drop_column('game_sessions', 'hints_used')
