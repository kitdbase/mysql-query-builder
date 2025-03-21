// checkEnv.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Verifies that the required environment variables are configured.
 * If they are not configured, it creates or updates the `.env` file with the necessary variables and default values.
 */
function checkEnvVariables() {
    try {
        // Load environment variables from the .env file
        dotenv.config();

        // Define the required environment variables and their default values
        const requiredEnvVars = {
            MYSQL_DATABASE: 'database',
            MYSQL_USER: 'user_name',
            MYSQL_PASSWORD: 'password',
            MYSQL_HOST: 'localhost',
            MYSQL_PORT: '3306',
        };

        // Check if all required variables are defined
        const missingVars = Object.keys(requiredEnvVars).filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            // Get the root directory of the project (where package.json is located)
            const rootDir = process.env.INIT_CWD || process.cwd();

            // Path to the .env file (in the root directory of the project)
            const envFilePath = path.resolve(rootDir, '.env');

            // Read the existing .env file (if it exists)
            let envFileContent = '';
            if (fs.existsSync(envFilePath)) {
                envFileContent = fs.readFileSync(envFilePath, 'utf8');
            }

            // Add the missing variables to the .env file with default values
            missingVars.forEach(varName => {
                // Check if the variable already exists in the .env file
                if (!envFileContent.includes(`${varName}=`)) {
                    envFileContent += `\n${varName}=${requiredEnvVars[varName]}`;
                }
            });

            // Write the updated .env file
            fs.writeFileSync(envFilePath, envFileContent.trim());

            // Show an informative message in the console
            console.log(
                `⚠️  Warning: The following environment variables are required but not configured: ${missingVars.join(', ')}.\n` +
                `The .env file has been created/updated in the project root folder (${rootDir}) with default values. Please configure the values and restart the application.\n`
            );
        } else {
            console.log('✅  All required environment variables are configured.\n');
        }
    } catch (error) {
        // If an error occurs, log it to the console
        console.error('❌  An error occurred while checking environment variables:', error.message);
    }
}

// Call the function when the application starts
checkEnvVariables();