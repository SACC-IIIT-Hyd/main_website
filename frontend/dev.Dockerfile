# # Corrected frontend/dev.Dockerfile

# # build and start
# FROM node:20-slim as build
# WORKDIR /app

# # 1. Copy package files
# COPY package.json package-lock.json ./ 

# # 2. INSTALL ALL DEPENDENCIES (CRITICAL MISSING STEP)
# RUN npm install

# # 3. Copy the rest of the application source code
# COPY . .

# # 4. Start the application in development mode
# # ENTRYPOINT [ "npm", "run", "dev" ]
# CMD ["npm", "run", "dev"]

# Corrected frontend/dev.Dockerfile

FROM node:20-slim as build
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm install
COPY . .

# FIX: Change the ENTRYPOINT/CMD to explicitly use the npm executable path.
# We will use 'npm run dev' but ensure the command works by changing the shell command.
# Alternatively, modify the container's environment PATH:
ENV PATH /app/node_modules/.bin:$PATH
CMD ["npm", "run", "dev"]