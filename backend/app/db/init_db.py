"""Database initialization and seeding utilities."""

import logging
from sqlalchemy import select
from app.core.security import hash_password
from app.db.session import async_session_factory
from app.models.user import User, UserRole
from app.models.word import DifficultyLevel, Word

logger = logging.getLogger("guess_the_word")

DEFAULT_WORDS = [
    # EASY (Common, concrete everyday objects)
    {"word": "apple", "hint": "A sweet red or green fruit that grows on trees", "difficulty": DifficultyLevel.EASY},
    {"word": "beach", "hint": "A sandy shore next to the ocean or sea", "difficulty": DifficultyLevel.EASY},
    {"word": "bread", "hint": "Food made of flour, water, and yeast baked together", "difficulty": DifficultyLevel.EASY},
    {"word": "chair", "hint": "A piece of furniture designed for one person to sit on", "difficulty": DifficultyLevel.EASY},
    {"word": "clock", "hint": "An instrument used to measure and display time", "difficulty": DifficultyLevel.EASY},
    {"word": "cloud", "hint": "A visible mass of condensed water vapor floating in the sky", "difficulty": DifficultyLevel.EASY},
    {"word": "dance", "hint": "Moving rhythmically to music", "difficulty": DifficultyLevel.EASY},
    {"word": "house", "hint": "A building designed for human habitation", "difficulty": DifficultyLevel.EASY},
    {"word": "smile", "hint": "A facial expression showing pleasure or amusement", "difficulty": DifficultyLevel.EASY},
    {"word": "water", "hint": "A transparent fluid that forms streams, lakes, and oceans", "difficulty": DifficultyLevel.EASY},

    # MEDIUM (Descriptive, environmental, natural entities)
    {"word": "earth", "hint": "The third planet from the sun and our home", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "fruit", "hint": "The sweet and fleshy product of a tree or plant", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "grape", "hint": "A small, round purple or green berry used to make wine", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "light", "hint": "The natural agent that stimulates sight and makes things visible", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "music", "hint": "Vocal or instrumental sounds combined to produce harmony", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "ocean", "hint": "A vast body of salt water covering much of the Earth", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "plant", "hint": "A living organism that absorbs water and synthesizes nutrients", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "space", "hint": "The physical universe beyond the earth's atmosphere", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "storm", "hint": "A violent disturbance of the atmosphere with strong winds and rain", "difficulty": DifficultyLevel.MEDIUM},
    {"word": "tiger", "hint": "A very large solitary cat with a yellow-brown coat striped with black", "difficulty": DifficultyLevel.MEDIUM},

    # HARD (Abstract, intricate, or distinctive letter patterns)
    {"word": "brain", "hint": "The organ inside your head that controls thinking", "difficulty": DifficultyLevel.HARD},
    {"word": "dream", "hint": "Thoughts, images, and sensations occurring during sleep", "difficulty": DifficultyLevel.HARD},
    {"word": "flame", "hint": "The visible, glowing part of a fire", "difficulty": DifficultyLevel.HARD},
    {"word": "frost", "hint": "A deposit of small white ice crystals formed on the ground", "difficulty": DifficultyLevel.HARD},
    {"word": "glyph", "hint": "A hieroglyphic character or symbol", "difficulty": DifficultyLevel.HARD},
    {"word": "prism", "hint": "A glass object with polished flat surfaces that refracts light", "difficulty": DifficultyLevel.HARD},
    {"word": "river", "hint": "A large natural stream of water flowing to the sea", "difficulty": DifficultyLevel.HARD},
    {"word": "stone", "hint": "Hard solid non-metallic mineral matter rock", "difficulty": DifficultyLevel.HARD},
    {"word": "table", "hint": "A piece of furniture with a flat top and one or more legs", "difficulty": DifficultyLevel.HARD},
    {"word": "vivid", "hint": "Producing powerful feelings or strong, clear images in the mind", "difficulty": DifficultyLevel.HARD},
]


async def init_db() -> None:
    """Initialize database default state: seed admin account and default 5-letter words if not present."""
    async with async_session_factory() as session:
        try:
            # 1. Check / seed default admin account
            result = await session.execute(
                select(User).where(User.username == "admin")
            )
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                logger.info("Default admin user not found. Creating admin user (username: admin)...")
                admin_user = User(
                    username="admin",
                    password_hash=hash_password("admin@123"),
                    role=UserRole.ADMIN.value,
                    is_active=True,
                )
                session.add(admin_user)
                await session.flush()
                logger.info("Default admin user created successfully.")
            else:
                logger.info("Default admin user already exists.")

            # 2. Check / seed default five-letter words
            word_check = await session.execute(select(Word).limit(1))
            existing_word = word_check.scalar_one_or_none()

            if not existing_word:
                logger.info("Words table is empty. Inserting 20 default five-letter words...")
                for item in DEFAULT_WORDS:
                    word_entry = Word(
                        word=item["word"].lower().strip(),
                        hint=item["hint"],
                        difficulty=item["difficulty"],
                        is_active=True,
                        created_by=admin_user.id,
                    )
                    session.add(word_entry)
                await session.commit()
                logger.info(f"Successfully inserted {len(DEFAULT_WORDS)} default words into the database.")
            else:
                logger.info("Words table already contains data. Seeding default words skipped.")
                await session.commit()

        except Exception as e:
            await session.rollback()
            logger.warning(f"Database initialization check skipped or failed: {e}")
