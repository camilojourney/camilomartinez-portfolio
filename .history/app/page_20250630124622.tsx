import { BlogPosts } from 'app/components/posts'

export default function Page() {
  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Camilo Martinez
      </h1>
      <h2 className="mb-8 text-xl text-neutral-600 dark:text-neutral-400">
        Data Analyst & AI Developer Specializing in NLP
      </h2>
      <p className="mb-4">
        I build intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a passion for NLP, I develop solutions that range from automated content creation to personalized AI coaching.
      </p>
      <p className="mb-8">
        My philosophy is simple: data, used correctly, empowers us to achieve more. I build efficient, data-driven workflows that unleash the full capabilities of people and companies.
      </p>
      <div className="mb-8">
        <p className="mb-4 text-neutral-700 dark:text-neutral-300">
          Interested in collaborating? View my projects or contact me.
        </p>
      </div>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  )
}
