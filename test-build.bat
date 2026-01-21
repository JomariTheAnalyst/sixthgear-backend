@echo off
echo ========================================
echo Sixthgear Backend - Pre-Deployment Test
echo ========================================
echo.

echo [1/5] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    exit /b 1
)
echo ✓ Node.js found
echo.

echo [2/5] Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [3/5] Running TypeScript type check...
call pnpm tsc --noEmit
if %errorlevel% neq 0 (
    echo ERROR: TypeScript errors found!
    echo Please fix the errors above before deploying.
    exit /b 1
)
echo ✓ No TypeScript errors
echo.

echo [4/5] Building the project...
call pnpm build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    echo Check the errors above.
    exit /b 1
)
echo ✓ Build successful
echo.

echo [5/5] Checking environment variables...
if not exist .env (
    echo WARNING: .env file not found!
    echo Make sure to configure environment variables in production.
) else (
    echo ✓ .env file exists
)
echo.

echo ========================================
echo ✓ ALL TESTS PASSED!
echo ========================================
echo.
echo Your backend is ready for deployment.
echo.
echo Next steps:
echo 1. Push code to GitHub
echo 2. Configure environment variables in Railway/Render
echo 3. Deploy and run migrations
echo 4. Create admin user
echo.
pause
