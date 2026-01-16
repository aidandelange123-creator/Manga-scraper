#!/usr/bin/env node

import axios from 'axios';
import * as cheerio from 'cheerio';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';

class MangaScraper {
  constructor() {
    this.baseUrl = 'https://manganato.com';
    this.downloadPath = './downloads'; // Default download path
  }

  async makeRequest(url) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      throw error;
    }
  }

  async getLatestManga() {
    const html = await this.makeRequest(this.baseUrl);
    const $ = cheerio.load(html);
    
    const mangaList = [];
    $('div.content-homepage-item').each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a.a-h');
      const $img = $element.find('img.img-loading');
      
      const title = $link.text().trim();
      const url = $link.attr('href');
      const cover = $img.attr('src');
      
      if (title && url && cover) {
        mangaList.push({
          title,
          url,
          cover
        });
      }
    });
    
    return mangaList;
  }

  async searchManga(keyword) {
    const searchUrl = `${this.baseUrl}/search/story/${keyword.replace(/ /g, '_')}`;
    const html = await this.makeRequest(searchUrl);
    const $ = cheerio.load(html);
    
    const results = [];
    $('div.search-story-item').each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a.a-h');
      const $img = $element.find('img.img-loading');
      
      const title = $link.text().trim();
      const url = $link.attr('href');
      const cover = $img.attr('src');
      
      if (title && url && cover) {
        results.push({
          title,
          url,
          cover
        });
      }
    });
    
    return results;
  }

  async getMangaDetails(url) {
    const html = await this.makeRequest(url);
    const $ = cheerio.load(html);
    
    const title = $('h1').first().text().trim();
    const cover = $('img.img-loading').attr('src');
    const description = $('div.panel-story-info-description').text().trim();
    
    const chapters = [];
    $('li.a-h').each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a');
      const name = $link.text().trim();
      const chapterUrl = $link.attr('href');
      
      if (name && chapterUrl) {
        chapters.push({
          name,
          url: chapterUrl
        });
      }
    });
    
    // Reverse the order of chapters to get them in ascending order
    chapters.reverse();
    
    return {
      title,
      cover,
      description,
      chapters
    };
  }

  async getChapterImages(url) {
    const html = await this.makeRequest(url);
    const $ = cheerio.load(html);
    
    const images = [];
    $('div.container-chapter-reader > img').each((index, element) => {
      const src = $(element).attr('src');
      if (src) {
        images.push(src.trim());
      }
    });
    
    return images;
  }

  async downloadImage(url, filePath) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Error downloading image ${url}:`, error.message);
      throw error;
    }
  }

  async downloadManga(manga, selectedChapters) {
    // Create manga folder
    const mangaFolder = path.join(this.downloadPath, manga.title.replace(/[<>:"/\\|?*]/g, '_'));
    await fs.ensureDir(mangaFolder);
    
    console.log(`Downloading manga: ${manga.title}`);
    
    // Download cover image
    if (manga.cover) {
      const coverExt = path.extname(manga.cover) || '.jpg';
      const coverPath = path.join(mangaFolder, `cover${coverExt}`);
      try {
        await this.downloadImage(manga.cover, coverPath);
        console.log(`Downloaded cover image`);
      } catch (error) {
        console.warn(`Could not download cover image:`, error.message);
      }
    }
    
    // Download selected chapters
    for (let i = 0; i < selectedChapters.length; i++) {
      const chapter = selectedChapters[i];
      console.log(`Downloading chapter: ${chapter.name} (${i + 1}/${selectedChapters.length})`);
      
      // Create chapter folder
      const chapterFolder = path.join(mangaFolder, chapter.name.replace(/[<>:"/\\|?*]/g, '_'));
      await fs.ensureDir(chapterFolder);
      
      // Get chapter images
      const images = await this.getChapterImages(chapter.url);
      
      // Download each image
      for (let j = 0; j < images.length; j++) {
        const imageUrl = images[j];
        const ext = path.extname(imageUrl) || '.jpg';
        const imagePath = path.join(chapterFolder, `${String(j + 1).padStart(3, '0')}${ext}`);
        
        try {
          await this.downloadImage(imageUrl, imagePath);
          process.stdout.write('.'); // Show progress
        } catch (error) {
          console.warn(`Failed to download image ${imageUrl}:`, error.message);
        }
      }
      console.log(); // New line after chapter download
    }
    
    console.log(`Finished downloading: ${manga.title}`);
  }

  async setDownloadPath() {
    const { downloadPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'downloadPath',
        message: 'Enter download folder path:',
        default: './downloads',
        validate: (input) => {
          if (!input) return 'Please enter a valid path';
          return true;
        }
      }
    ]);
    
    this.downloadPath = path.resolve(downloadPath);
    await fs.ensureDir(this.downloadPath);
    console.log(`Download path set to: ${this.downloadPath}`);
  }
}

async function main() {
  const scraper = new MangaScraper();
  
  console.log('=== Terminal-Based Manga Scraper ===');
  
  // Set download path
  await scraper.setDownloadPath();
  
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Choose an action:',
        choices: [
          'Search Manga',
          'Browse Latest Manga',
          'Exit'
        ]
      }
    ]);
    
    if (action === 'Exit') {
      console.log('Goodbye!');
      break;
    }
    
    let mangaList = [];
    
    if (action === 'Search Manga') {
      const { keyword } = await inquirer.prompt([
        {
          type: 'input',
          name: 'keyword',
          message: 'Enter manga title to search:'
        }
      ]);
      
      if (!keyword.trim()) {
        console.log('Please enter a valid search term.');
        continue;
      }
      
      console.log('Searching...');
      mangaList = await scraper.searchManga(keyword);
    } else if (action === 'Browse Latest Manga') {
      console.log('Fetching latest manga...');
      mangaList = await scraper.getLatestManga();
    }
    
    if (mangaList.length === 0) {
      console.log('No manga found.');
      continue;
    }
    
    // Select manga
    const mangaChoices = mangaList.map((manga, index) => ({
      name: `${index + 1}. ${manga.title}`,
      value: manga
    }));
    
    const { selectedManga } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedManga',
        message: 'Select a manga:',
        choices: [...mangaChoices, new inquirer.Separator(), 'Back']
      }
    ]);
    
    if (selectedManga === 'Back') {
      continue;
    }
    
    // Get manga details
    console.log('Fetching manga details...');
    const details = await scraper.getMangaDetails(selectedManga.url);
    
    console.log(`\nTitle: ${details.title}`);
    console.log(`Description: ${details.description}`);
    console.log(`Total chapters: ${details.chapters.length}\n`);
    
    // Select chapters to download
    const chapterChoices = details.chapters.map((chapter, index) => ({
      name: `${index + 1}. ${chapter.name}`,
      value: chapter
    }));
    
    const { selectedChapters } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedChapters',
        message: 'Select chapters to download (use space to select):',
        choices: [
          ...chapterChoices.slice(0, 20), // Limit to first 20 chapters to avoid too many options
          new inquirer.Separator(),
          {
            name: 'All chapters',
            value: 'all'
          },
          'Back'
        ],
        pageSize: 10
      }
    ]);
    
    if (selectedChapters.includes('Back')) {
      continue;
    }
    
    let chaptersToDownload = selectedChapters;
    if (selectedChapters.includes('all')) {
      chaptersToDownload = details.chapters;
    }
    
    if (chaptersToDownload.length === 0) {
      console.log('No chapters selected.');
      continue;
    }
    
    // Confirm download
    const { confirmDownload } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDownload',
        message: `Download ${chaptersToDownload.length} chapters of "${details.title}"?`,
        default: true
      }
    ]);
    
    if (confirmDownload) {
      await scraper.downloadManga(details, chaptersToDownload);
      console.log('\nDownload complete!\n');
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the application
main().catch(console.error);