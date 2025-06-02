# Ecommerce Application

## CI/CD Pipeline

This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD) to automatically build and deploy the application to Render.

### Workflow Overview

The CI/CD pipeline is triggered automatically on every push to the `main` branch and consists of the following stages:

1. **Build Stage**
   - Checkout of the source code
   - Setup .NET 7.0 environment
   - Restore project dependencies
   - Build the application in Release configuration
   - Run automated tests

2. **Deploy Stage**
   - Automatic deployment to Render using Render API

### Prerequisites for Deployment

To enable automatic deployments, you need to configure the following secrets in your GitHub repository:

1. `RENDER_API_KEY`: Your Render API key
2. `RENDER_SERVICE_ID`: The ID of your Render service

To set up these secrets:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and Variables > Actions
3. Click on "New repository secret"
4. Add both secrets with their respective values

### Deployment Process

1. Push your changes to the `main` branch
2. GitHub Actions will automatically trigger the workflow
3. You can monitor the deployment progress in the "Actions" tab of your GitHub repository
4. Once completed, your application will be available on Render

### Troubleshooting

If the deployment fails, you can:
1. Check the GitHub Actions logs for error messages
2. Verify that all required secrets are properly configured
3. Ensure your Render service is properly set up and running
4. Check if the application builds successfully locally 