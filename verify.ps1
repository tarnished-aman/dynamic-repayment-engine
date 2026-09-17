# Verification script for Dynamic Risk & Repayment Engine
# Run this after setup to verify both backend and frontend are working

Write-Host "=== Dynamic Risk & Repayment Engine — Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking backend at http://localhost:8000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/borrowers" -Method GET -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host "  Borrowers in database: $($data.count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend is not responding" -ForegroundColor Red
    Write-Host "  Make sure you ran: uvicorn app.main:app --reload" -ForegroundColor Gray
    Write-Host "  in the backend/ directory" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Check trust score endpoint
Write-Host "Testing trust score endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/borrower/BOR001/score" -Method GET -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Trust score endpoint works" -ForegroundColor Green
    Write-Host "  BOR001 trust score: $($data.trust_score)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Trust score endpoint failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check cash flow analysis
Write-Host "Testing cash flow analysis endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/borrower/BOR001/cashflow-analysis" -Method GET -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Cash flow analysis works" -ForegroundColor Green
    Write-Host "  Hardship: $($data.hardship_classification)" -ForegroundColor Gray
    Write-Host "  Income change: $($data.income_change_pct)%" -ForegroundColor Gray
} catch {
    Write-Host "✗ Cash flow analysis failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check risk flags
Write-Host "Testing risk flags endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/borrower/BOR001/risk-flags" -Method GET -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Risk flags work" -ForegroundColor Green
    Write-Host "  Current flag: $($data.current_flag)" -ForegroundColor Gray
    Write-Host "  Upcoming flag: $($data.upcoming_flag) ($($data.upcoming_flag_month))" -ForegroundColor Gray
} catch {
    Write-Host "✗ Risk flags failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check payment plan
Write-Host "Testing payment plan endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/borrower/BOR001/payment-plan" -Method GET -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Payment plan works" -ForegroundColor Green
    Write-Host "  Original schedule: $($data.original_schedule.Count) installments" -ForegroundColor Gray
} catch {
    Write-Host "✗ Payment plan failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check chat endpoint with demo message
Write-Host "Testing chat endpoint with demo message..." -ForegroundColor Yellow
try {
    $body = @{
        borrower_id = "BOR001"
        message = "Baadh ne meri fasal barbaad kar di"
        language = "hi"
        input_type = "text"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:8000/chat/message" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Chat endpoint works" -ForegroundColor Green
    Write-Host "  Intent: $($data.intent)" -ForegroundColor Gray
    Write-Host "  Action: $($data.action_taken)" -ForegroundColor Gray
    Write-Host "  Reason: $($data.extracted_reason)" -ForegroundColor Gray
    
    if ($data.action_taken -eq "auto_relief") {
        Write-Host "  Payment plan updated: $($data.payment_plan_updated)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Chat endpoint failed" -ForegroundColor Red
    Write-Host "  This might be due to missing Groq API key" -ForegroundColor Gray
    Write-Host "  The demo message should still work with heuristic fallback" -ForegroundColor Gray
}

Write-Host ""

# Check frontend
Write-Host "Checking frontend at http://localhost:3000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -ErrorAction Stop -TimeoutSec 5
    Write-Host "✓ Frontend is running" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Frontend is not responding" -ForegroundColor Red
    Write-Host "  Make sure you ran: npm run dev" -ForegroundColor Gray
    Write-Host "  in the frontend/ directory" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor Gray
Write-Host "2. BOR001 (Raju Kumar) should be auto-selected" -ForegroundColor Gray
Write-Host "3. Send the demo message in the chat: 'Baadh ne meri fasal barbaad kar di'" -ForegroundColor Gray
Write-Host "4. Watch the payment plan update (Oct deferred, Jan 2027 added)" -ForegroundColor Gray
Write-Host ""
