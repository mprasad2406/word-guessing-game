"""Game foundation and admin settings migration

Revision ID: 0002_game_foundation_and_admin_settings
Revises: 0001_initial_users_table
Create Date: 2026-09-11 14:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_game_and_settings'
down_revision: Union[str, None] = '0001_initial_users_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely clean up partial tables if a previous run failed
    op.execute("DROP TABLE IF EXISTS audit_logs")
    op.execute("DROP TABLE IF EXISTS admin_security_settings")
    op.execute("DROP TABLE IF EXISTS game_sessions")
    op.execute("DROP TABLE IF EXISTS game_settings")
    op.execute("DROP TABLE IF EXISTS words")

    # 1. Words table
    op.create_table(
        'words',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('word', sa.String(length=50), nullable=False),
        sa.Column('hint', sa.String(length=255), nullable=True),
        sa.Column('difficulty', sa.String(length=20), nullable=False, server_default='MEDIUM'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('word', name='uq_words_word')
    )
    op.create_index(op.f('ix_words_id'), 'words', ['id'], unique=False)
    op.create_index(op.f('ix_words_is_active'), 'words', ['is_active'], unique=False)

    # 2. Game Settings table (Singleton enforced at id=1 with autoincrement=False)
    op.create_table(
        'game_settings',
        sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='6'),
        sa.Column('min_word_length', sa.Integer(), nullable=False, server_default='4'),
        sa.Column('max_word_length', sa.Integer(), nullable=False, server_default='8'),
        sa.Column('default_difficulty', sa.String(length=20), nullable=False, server_default='MEDIUM'),
        sa.Column('max_hints', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('time_limit_seconds', sa.Integer(), nullable=True, server_default='300'),
        sa.Column('scoring_multiplier', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('allow_repeated_guesses', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('allow_word_reuse', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('game_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('id = 1', name='ck_game_settings_singleton'),
        sa.CheckConstraint('max_attempts > 0', name='ck_game_settings_max_attempts_positive'),
        sa.CheckConstraint('min_word_length > 0', name='ck_game_settings_min_word_length_positive'),
        sa.CheckConstraint('max_word_length >= min_word_length', name='ck_game_settings_word_length_range'),
        sa.CheckConstraint('max_hints >= 0', name='ck_game_settings_max_hints_non_negative'),
        sa.CheckConstraint('scoring_multiplier > 0', name='ck_game_settings_scoring_multiplier_positive'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Seed default game settings row
    op.execute(
        "INSERT INTO game_settings (id, max_attempts, min_word_length, max_word_length, default_difficulty, max_hints, time_limit_seconds, scoring_multiplier, allow_repeated_guesses, allow_word_reuse, game_enabled, created_at, updated_at) "
        "VALUES (1, 6, 4, 8, 'MEDIUM', 2, 300, 1.0, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )

    # 3. Game Sessions table
    op.create_table(
        'game_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('player_id', sa.Integer(), nullable=False),
        sa.Column('word_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='ACTIVE'),
        sa.Column('max_attempts', sa.Integer(), nullable=False),
        sa.Column('attempts_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('settings_snapshot', sa.JSON(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['player_id'], ['users.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['word_id'], ['words.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_game_sessions_id'), 'game_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_game_sessions_player_id'), 'game_sessions', ['player_id'], unique=False)
    op.create_index(op.f('ix_game_sessions_word_id'), 'game_sessions', ['word_id'], unique=False)
    op.create_index(op.f('ix_game_sessions_status'), 'game_sessions', ['status'], unique=False)

    # 4. Admin Security Settings table (Singleton at id=1 with autoincrement=False)
    op.create_table(
        'admin_security_settings',
        sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('secret_key_hash', sa.String(length=255), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('id = 1', name='ck_admin_security_singleton'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Audit Logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('admin_user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.String(length=50), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_admin_user_id'), 'audit_logs', ['admin_user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_target_type'), 'audit_logs', ['target_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_audit_logs_target_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_admin_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_table('admin_security_settings')

    op.drop_index(op.f('ix_game_sessions_status'), table_name='game_sessions')
    op.drop_index(op.f('ix_game_sessions_word_id'), table_name='game_sessions')
    op.drop_index(op.f('ix_game_sessions_player_id'), table_name='game_sessions')
    op.drop_index(op.f('ix_game_sessions_id'), table_name='game_sessions')
    op.drop_table('game_sessions')

    op.drop_table('game_settings')

    op.drop_index(op.f('ix_words_is_active'), table_name='words')
    op.drop_index(op.f('ix_words_id'), table_name='words')
    op.drop_table('words')
