"""
PuraToDo Tauri App - Autonomous Agent Loop
==========================================

This module implements the long-running agent system following Anthropic's guide:
https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

The system uses two types of agents:
1. Initializer Agent - Sets up the environment on first run
2. Coding Agent - Makes incremental progress in each subsequent session

Usage:
    python agent.py                           # Run with default settings
    python agent.py --max-iterations 5        # Limit iterations
    python agent.py --model claude-sonnet-4-5 # Specify model
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

# Configuration
AUTO_CONTINUE_DELAY_SECONDS = 3
PROJECT_DIR = Path(__file__).parent.resolve()  # Auto-detect project directory
PROMPTS_DIR = PROJECT_DIR / "prompts"


def print_header(title: str, char: str = "=", width: int = 70) -> None:
    """Print a formatted header."""
    print()
    print(char * width)
    print(f"  {title}")
    print(char * width)
    print()


def count_passing_tests() -> tuple[int, int]:
    """
    Count passing and total tests in feature_list.json.

    Returns:
        (passing_count, total_count)
    """
    tests_file = PROJECT_DIR / "feature_list.json"

    if not tests_file.exists():
        return 0, 0

    try:
        with open(tests_file, "r") as f:
            tests = json.load(f)

        total = len(tests)
        passing = sum(1 for test in tests if test.get("passes", False))

        return passing, total
    except (json.JSONDecodeError, IOError):
        return 0, 0


def print_session_header(session_num: int, is_initializer: bool) -> None:
    """Print a formatted header for the session."""
    session_type = "INITIALIZER AGENT" if is_initializer else "CODING AGENT"

    print()
    print("=" * 70)
    print(f"  SESSION {session_num}: {session_type}")
    print("=" * 70)
    print()


def print_progress_summary() -> None:
    """Print a summary of current progress."""
    passing, total = count_passing_tests()

    if total > 0:
        percentage = (passing / total) * 100
        print(f"\nProgress: {passing}/{total} tests passing ({percentage:.1f}%)")
    else:
        print("\nProgress: feature_list.json not yet created")


def get_initializer_prompt() -> str:
    """Read and return the initializer agent prompt."""
    prompt_file = PROMPTS_DIR / "initializer_prompt.md"
    if prompt_file.exists():
        with open(prompt_file, "r") as f:
            return f.read()
    else:
        raise FileNotFoundError(f"Initializer prompt not found: {prompt_file}")


def get_coding_prompt() -> str:
    """Read and return the coding agent prompt."""
    prompt_file = PROMPTS_DIR / "coding_prompt.md"
    if prompt_file.exists():
        with open(prompt_file, "r") as f:
            return f.read()
    else:
        raise FileNotFoundError(f"Coding prompt not found: {prompt_file}")


def check_feature_list_exists() -> bool:
    """Check if feature_list.json exists and is populated."""
    tests_file = PROJECT_DIR / "feature_list.json"
    if not tests_file.exists():
        return False

    try:
        with open(tests_file, "r") as f:
            tests = json.load(f)
        return len(tests) > 0
    except (json.JSONDecodeError, IOError):
        return False


def append_to_progress_log(content: str) -> None:
    """Append content to the progress log file."""
    progress_file = PROJECT_DIR / "claude-progress.txt"

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header = f"\n\n---\n\n## Session Entry: {timestamp}\n\n"

    with open(progress_file, "a") as f:
        f.write(header + content)


async def run_with_claude_code(prompt: str) -> None:
    """
    Run the agent using Claude Code CLI.

    This is a placeholder that shows how the agent loop would work.
    In practice, you would use the Claude Agent SDK or Claude Code directly.
    """
    print("\n" + "-" * 70)
    print("PROMPT TO SEND TO CLAUDE:")
    print("-" * 70)
    print(f"\n{prompt[:500]}..." if len(prompt) > 500 else f"\n{prompt}")
    print("\n" + "-" * 70)
    print("""
To actually run the agent, you have several options:

1. Use Claude Code CLI directly:
   claude --print "{prompt_file}"

2. Use the Claude Agent SDK (Python):
   See https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk

3. Use the prompts in Claude Code interactive mode:
   - Copy the content of prompts/initializer_prompt.md or prompts/coding_prompt.md
   - Paste into Claude Code as your prompt

The agent will:
- Read app_spec.txt to understand what to build
- Generate/update feature_list.json with test cases
- Implement features incrementally
- Test and verify each feature
- Update claude-progress.txt with progress
- Commit changes to git
""")


async def run_autonomous_agent(
    model: str = "claude-sonnet-4-5",
    max_iterations: Optional[int] = None,
) -> None:
    """
    Run the autonomous agent loop.

    This is the main entry point for the agent system. It determines whether
    to use the Initializer Agent or Coding Agent based on the current state.

    Args:
        model: Claude model to use
        max_iterations: Maximum number of iterations (None for unlimited)
    """
    print_header("PuraToDo Tauri App - Autonomous Agent")

    print(f"Model: {model}")
    if max_iterations:
        print(f"Max iterations: {max_iterations}")
    else:
        print("Max iterations: Unlimited (will run until completion)")

    # Check if this is a fresh start or continuation
    has_features = check_feature_list_exists()
    is_first_run = not has_features

    if is_first_run:
        print("\nFresh start - will use INITIALIZER AGENT")
        print()
        print("=" * 70)
        print("  NOTE: First session takes 10-20+ minutes!")
        print("  The agent is generating 200 detailed test cases.")
        print("  This may appear to hang - it's working.")
        print("=" * 70)
    else:
        print("\nContinuing existing project")
        print_progress_summary()

    # Main loop
    iteration = 0

    while True:
        iteration += 1

        # Check max iterations
        if max_iterations and iteration > max_iterations:
            print(f"\nReached max iterations ({max_iterations})")
            print("To continue, run the script again without --max-iterations")
            break

        # Print session header
        print_session_header(iteration, is_first_run)

        # Choose prompt based on session type
        if is_first_run:
            prompt = get_initializer_prompt()
            print("Running INITIALIZER AGENT...")
            print("This agent will:")
            print("  1. Read app_spec.txt")
            print("  2. Generate feature_list.json with 200+ test cases")
            print("  3. Initialize Tauri project structure")
            print("  4. Create init.sh script")
            print("  5. Make initial git commit")
            is_first_run = False  # Only use initializer once
        else:
            prompt = get_coding_prompt()
            print("Running CODING AGENT...")
            print("This agent will:")
            print("  1. Read progress and git history")
            print("  2. Choose one feature to implement")
            print("  3. Implement and test the feature")
            print("  4. Update feature_list.json")
            print("  5. Commit progress")

        print()

        # Run the agent
        await run_with_claude_code(prompt)

        # Show progress
        print_progress_summary()

        # Auto-continue prompt
        print(f"\nAgent session complete. Auto-continue in {AUTO_CONTINUE_DELAY_SECONDS}s...")
        await asyncio.sleep(AUTO_CONTINUE_DELAY_SECONDS)

        # For demo, we'll stop after showing the prompt
        # In a real implementation, this would loop until all tests pass
        print("\n" + "=" * 70)
        print("  DEMO MODE - Stopping after showing prompt structure")
        print("  In production, this would loop until all 200+ tests pass")
        print("=" * 70)
        break

    # Final summary
    print_header("SESSION COMPLETE")
    print_progress_summary()

    print("\n" + "-" * 70)
    print("  TO RUN THE GENERATED APPLICATION:")
    print("-" * 70)
    print("\n  ./init.sh           # Run the setup script")
    print("  # Or manually:")
    print("  npm run tauri dev   # Start development server")
    print("-" * 70)

    print("\nDone!")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="PuraToDo Tauri App - Autonomous Agent Loop"
    )
    parser.add_argument(
        "--model",
        default="claude-sonnet-4-5",
        help="Claude model to use (default: claude-sonnet-4-5)",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=None,
        help="Maximum number of iterations (default: unlimited)",
    )

    args = parser.parse_args()

    try:
        asyncio.run(run_autonomous_agent(
            model=args.model,
            max_iterations=args.max_iterations,
        ))
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(0)


if __name__ == "__main__":
    main()
