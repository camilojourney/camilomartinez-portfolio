export default function ContactPage() {
    return (
        <section className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="max-w-lg">
                <h1 className="text-4xl font-bold mb-4">Let's Connect</h1>
                <p className="text-lg text-gray-400 mb-8">
                    I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious team.
                </p>
                <div className="space-y-6">
                    <a href="mailto:your.email@example.com" className="block text-xl font-bold text-cyan-400 hover:underline">
                        your.email@example.com
                    </a>
                    <div className="flex justify-center space-x-6">
                        <a href="https://www.linkedin.com/in/your-profile" target="_blank" rel="noopener noreferrer" className="text-lg hover:text-cyan-400 transition-colors">
                            LinkedIn
                        </a>
                        <a href="https://github.com/camilomartinez777" target="_blank" rel="noopener noreferrer" className="text-lg hover:text-cyan-400 transition-colors">
                            GitHub
                        </a>
                        {/* Add YouTube/Instagram here if you want them */}
                    </div>
                </div>
            </div>
        </section>
    );
}
