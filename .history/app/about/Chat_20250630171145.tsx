import Chat from '@/components/Chat';

export default function AboutPage() {
    return (
        <section className="py-12">
            <h1 className="text-4xl font-bold text-center mb-4">Interactive 'About Me'</h1>
            <p className="text-lg text-gray-400 text-center max-w-2xl mx-auto mb-10">
                This is a live demo of an application I designed to showcase my skills. Ask a question below to learn more about my background, skills, and even my real-time (mock) health data.
            </p>
            <div className="max-w-3xl mx-auto">
                <Chat />
            </div>
        </section>
    );
}
