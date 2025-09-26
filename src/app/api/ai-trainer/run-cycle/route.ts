import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    console.log('🚀 AI Trainer: Starting evaluation cycle trigger');
    
    // Parse request body to get number of questions
    let numQuestions = 5; // Default to 5 questions
    try {
      const body = await request.json();
      numQuestions = body.numQuestions || 5;
      console.log(`📊 Requested number of questions: ${numQuestions}`);
    } catch (e) {
      console.log('📊 Using default number of questions: 5');
    }
    
    // Use absolute path to the script
    const scriptPath = path.resolve(process.cwd(), 'src/scripts/ai/run-evaluation-cycle.ts');
    
    console.log(`📍 Script path: ${scriptPath}`);
    
    // Use `exec` to run the script as a background process.
    // This is crucial because the evaluation cycle can take several minutes,
    // and we don't want the HTTP request to time out.
    const tsxPath = path.resolve(process.cwd(), 'node_modules/.bin/tsx');
    const command = `${tsxPath} ${scriptPath}`;
    
    console.log(`🔧 Executing command: ${command}`);
    
    exec(command, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development',
        NUM_QUESTIONS: numQuestions.toString()
      }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`💥 Evaluation script error: ${error.message}`);
        return;
      }
      if (stderr && !stderr.includes('deprecated')) {
        console.error(`⚠️ Evaluation script stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(`📄 Evaluation script output: ${stdout}`);
      }
    });

    // Generate a cycle ID for tracking (timestamp-based)
    const cycleId = `cycle_${Date.now()}`;
    
    // Immediately respond to the client so the UI doesn't hang
    return NextResponse.json({ 
      success: true,
      message: "AI Trainer evaluation cycle started successfully. Results will be available on the dashboard shortly.",
      cycleId: cycleId,
      estimatedDuration: "2-5 minutes",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 Failed to start AI Trainer evaluation cycle:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to start evaluation cycle',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check if a cycle is currently running
export async function GET() {
  try {
    // You could check the database for any cycles without end_time
    // For now, just return basic info
    return NextResponse.json({
      success: true,
      message: "AI Trainer API is operational",
      endpoints: {
        "POST /api/ai-trainer/run-cycle": "Trigger new evaluation cycle",
        "GET /api/ai-trainer/history": "Get evaluation history (not implemented yet)"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get AI Trainer status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}