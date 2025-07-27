# Alumni Pages System

This directory contains the dynamic alumni pages system. The system automatically creates alumni pages based on JSON files in the `/public` directory.

## How to Add a New Alumni Batch

1. Create a JSON file in the `/public` directory with the naming format `alumni_YYYY.json` (e.g., `alumni_2022.json`).
2. Create a folder for the batch images in `/public/assets/images/YYYY` (e.g., `/public/assets/images/2022/`).
3. The JSON file should follow the same structure as the existing alumni files, with each entry containing:
   ```json
   {
     "name": "Student Name",
     "email": "student@example.com", 
     "instagram": "instagram_handle",
     "linkedin": "https://linkedin.com/in/profile",
     "dob": "YYYY-MM-DD",
     "branch": "CSE",
     "tagline": "Student's tagline",
     "nickname": "Nick",
     "pfp": "images/student_pfp.png",
     "group photos": [
       "images/student_gp1.png",
       "images/student_gp2.png"
     ],
     "journal": [
       {
         "question": "Question text?",
         "answer": "Answer text"
       }
     ],
     "testimonials": [
       {
         "name": "Person Name",
         "relation": "Friend",
         "pfp": "images/person_pfp.png",
         "text": "Testimonial text"
       }
     ]
   }
   ```

4. All image paths in the JSON should be relative to the year's images directory. For example, if your image is at `/public/assets/images/2022/student_pfp.png`, reference it as `images/student_pfp.png` in the JSON.

5. The system will automatically:
   - Add the new batch to the main alumni page
   - Create a dedicated batch page with all alumni
   - Create individual alumni profile pages

No code changes are required to add a new batch - just add the JSON file and images!
