# Commit Roulette

**Add a little chaos to your coding life!**

Commit Roulette is a VS Code extension designed for streamers, content creators, and anyone who thinks coding is just a little *too* safe. Every time you commit code, there's a chance a random "curse" will be applied to your editor.

Don't worry, everything is reversible!

## Features

### The Curses
When you commit, one of these might happen:

*   **Variable Reverser:** `const myVariable` becomes `const elbairiaVym`. Good luck reading that!
*   **Emoji Injector:** Adds random emojis to your comments and strings.
*   **Comic Sans Theme:** Forces your editor font to Comic Sans. The horror!
*   **Sound Effects:** Plays random sound effects to startle you.
*   **Color Inverter:** Inverts your theme colors. Dark mode becomes light mode (sort of).
*   **Keyboard Lagger:** Simulates input lag. Typing... feels... slow...
*   **Indent Switcher:** Randomly converts tabs to spaces (or vice versa) in your file.
*   **The Jitterbug (File Hopper):** Randomly switches between your open files and leaves "helpful" comments like `// I'm watching you...`.
*   **Australian Mode:** Flips your code upside down. G'day mate! 
*   **Placebo Curse:** Nothing happens... or does it? (It doesn't, but the suspense is terrible).

### The Dashboard
Run `Commit Roulette: Show Statistics` to open the dashboard.
*   **Track your luck:** See how many curses you've survived.
*   **Toggle Curses:** Enable/disable specific curses you hate (or love).
*   **History:** View a log of all past curses.

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/maverickkamal/Commit-Roulette.git
    cd Commit-Roulette
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the extension:**
    ```bash
    npm run compile
    ```
4.  **Run in VS Code:**
    *   Open the folder in VS Code.
    *   Press `F5` to start the extension in a new Extension Development Host window.

## Undoing Curses

Most curses are temporary and will revert automatically after the configured `curseDuration` (default: 5 minutes).

**Need to stop it NOW?**
*   Run the command `Commit Roulette: Undo Current Curse` from the Command Palette (`Ctrl+Shift+P`).
*   Or click the "Undo" button in the notification that appears when a curse starts.

## Configuration

You can tweak the chaos in your VS Code settings:

*   `commitRoulette.enabled`: Turn the whole thing on/off.
*   `commitRoulette.probability`: Chance of a curse triggering (0.0 to 1.0). Default is 1.0 (100%).
*   `commitRoulette.curseDuration`: How long (in minutes) temporary curses last.
*   `commitRoulette.enabledCurses`: Select exactly which curses are allowed to run.

## Commands

*   `Commit Roulette: Show Statistics`: Opens the dashboard.
*   `Commit Roulette: Undo Current Curse`: Immediately stops the active curse.
*   `Commit Roulette: Trigger Test Curse`: Manually triggers a random curse (for testing).

## Disclaimer

This extension is for entertainment purposes. While all curses are designed to be reversible or temporary, **please use version control** (which you are doing anyway, right?) to ensure you don't lose any important work.

**Happy Committing!** 🎲

*P.S AI assited in writing this readme.md*
