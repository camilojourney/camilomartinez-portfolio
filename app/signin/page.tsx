export default function SignInPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">Sign In</h1>
                <p className="text-gray-400 mb-8">You will be redirected shortly...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
            </div>
            {/* Auth.js will automatically handle showing error messages here */}
        </div>
    );
}
