import fs from 'fs';
import path from 'path';

/**
 * Get all alumni years from the JSON files in the public directory
 * @returns {Array} Array of year strings (e.g., ["2021", "2022"])
 */
export function getAlumniYears() {
    try {
        // Read the public directory
        const publicDir = path.join(process.cwd(), 'public');
        const files = fs.readdirSync(publicDir);

        // Filter for alumni_YEAR.json files
        const alumniFiles = files.filter(file =>
            file.startsWith('alumni_') &&
            file.endsWith('.json')
        );

        // Extract the years from the filenames
        const years = alumniFiles.map(file => {
            const match = file.match(/alumni_(\d+)\.json/);
            return match ? match[1] : null;
        }).filter(Boolean);

        return years;
    } catch (error) {
        console.error('Error reading alumni files:', error);
        return [];
    }
}

/**
 * Get alumni data for a specific year
 * @param {string} year - The year to get alumni data for
 * @returns {Array|null} Array of alumni data or null if file doesn't exist
 */
export function getAlumniData(year) {
    try {
        const filePath = path.join(process.cwd(), 'public', `alumni_${year}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error reading alumni data for year ${year}:`, error);
        return null;
    }
}

/**
 * Check if a year directory exists in the images folder
 * @param {string} year - The year to check
 * @returns {boolean} True if the directory exists
 */
export function hasYearImagesDirectory(year) {
    try {
        const dirPath = path.join(process.cwd(), 'public', 'assets', 'images', year);
        return fs.existsSync(dirPath);
    } catch (error) {
        return false;
    }
}
