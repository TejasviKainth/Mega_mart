import { Link } from 'react-router-dom'

export default function Home() {
  const categories = [
    { name: 'Mobiles', img: 'https://soum.sa/en/blog/wp-content/uploads/2025/05/Mobile-Phones-2.webp' },
    { name: 'Laptops', img: 'https://hips.hearstapps.com/hmg-prod/images/ipad-vs-laptop-668d1cee7fa81.jpeg' },
    { name: 'Audio', img: 'https://swarajya.gumlet.io/swarajya/2021-09/06416474-8c7f-46e2-a48a-e98e191fc9b1/Product_image.png?w=610&q=50&compress=true&format=auto' },
    { name: 'Appliances', img: 'https://cdn.firstcry.com/education/2023/01/13101355/Names-Of-Household-Appliances-In-English.jpg' },
    { name: 'Fashion', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQb4ZdFt3hPal9jsZIlFBPkCMCaFOS5sWGaSQ&s' },
    { name: 'Home & Kitchen', img: 'https://www.hunarcourses.com/blog/wp-content/uploads/2021/04/home-interior-design-ideas.jpg' }
  ]

  return (
    <div className="container">
      <section className="hero" style={{ marginBottom: 20 }}>
        <div className="hero-content" style={{ textAlign: 'center' }}>
          <h1>Everything you need, delivered</h1>
          <p>Discover deals on electronics, fashion, home essentials and more.</p>
          <Link to="/shop" className="btn primary">Shop Now</Link>
        </div>
      </section>

      <section className="grid" style={{ marginBottom: 20 }}>
        {categories.map(c => (
          <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="card" style={{ textDecoration: 'none' }}>
            <img src={c.img} alt={c.name} />
            <div className="row between" style={{ marginTop: 8 }}>
              <h3 style={{ margin: 0 }}>{c.name}</h3>
              <span className="muted">Explore →</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid">
        {[1,2,3].map(i => (
          <div key={i} className="card" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
            <div>
              <h3>Limited-time Offer {i}</h3>
              <p className="muted">Grab top-selling products at exciting prices. Shop now and save big.</p>
              <Link to="/shop" className="btn">View Deals</Link>
            </div>
            <img src={`https://picsum.photos/seed/promo${i}/600/400`} alt={`Promo ${i}`} style={{ borderRadius: 12 }} />
          </div>
        ))}
      </section>
    </div>
  )
}
