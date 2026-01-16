# Terminal-Based Manga Scraper

A command-line tool to scrape and download manga from various sources. This tool allows you to search for manga, browse the latest releases, and download entire chapters with images directly to your computer.

## Features

- Search for manga by title
- Browse latest manga releases
- Download manga covers and chapter images
- Organize downloads into structured folders
- Interactive terminal interface
- Chapter selection functionality
- Support for custom download paths

## Installation

1. Make sure you have Node.js installed on your system
2. Clone or download this project
3. Navigate to the project directory in your terminal
4. Run the following command to install dependencies:

```bash
npm install
```

## Usage

### Running on Windows
Double-click the `run.bat` file or run the following command in your terminal:

```bash
npm start
```

or

```bash
node index.js
```

### Running on Linux/Mac
Run the following command in your terminal:

```bash
npm start
```

or

```bash
node index.js
```

## How to Use

1. When prompted, enter the folder path where you want to save downloaded manga (default is ./downloads)
2. Choose to either search for a manga or browse latest releases
3. Select the manga you want to download
4. Choose which chapters you want to download
5. Confirm your selection to begin downloading

The downloaded manga will be organized in the following structure:
```
downloads/
└── [Manga Title]/
    ├── cover.jpg
    └── [Chapter Name]/
        ├── 001.jpg
        ├── 002.jpg
        └── ...
```

## Dependencies

This project uses the following npm packages:
- `axios` - for making HTTP requests
- `cheerio` - for parsing HTML and extracting data
- `inquirer` - for creating interactive command-line interfaces
- `fs-extra` - for advanced file system operations

## Supported Sources

Currently supports scraping from Manganato (https://manganato.com)

## Notes

- Be respectful of the source website's resources and terms of service
- Downloads happen sequentially, so larger manga series will take more time
- Each manga gets its own folder, and each chapter gets its subfolder
- The tool handles common filename issues by sanitizing folder names

## License

MIT License