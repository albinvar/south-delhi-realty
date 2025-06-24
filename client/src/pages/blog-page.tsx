import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import SEOHead from "@/components/seo/seo-head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, Home, MapPin, TrendingUp, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  author: string;
  image: string;
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Static blog posts data for SEO (in production, this would come from a CMS)
  const staticBlogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Ultimate Guide to Buying Properties in South Delhi 2024',
      slug: 'guide-buying-properties-south-delhi-2024',
      excerpt: 'Complete guide to buying premium properties in South Delhi. Expert tips on locations, pricing, legal aspects, and investment potential in Greater Kailash, Defence Colony, and Lajpat Nagar.',
      content: 'Full content here...',
      category: 'Buying Guide',
      tags: ['properties in south delhi', 'south delhi properties', 'property buying guide'],
      publishedAt: '2024-01-15',
      readTime: 8,
      author: 'South Delhi Realty Team',
      image: '/blog/south-delhi-properties-guide.jpg'
    },
    {
      id: '2',
      title: 'Top 10 Best Areas for Properties in South Delhi',
      slug: 'top-10-best-areas-properties-south-delhi',
      excerpt: 'Discover the most sought-after areas for real estate investment in South Delhi. From Greater Kailash to Hauz Khas, explore prime locations for luxury properties.',
      content: 'Full content here...',
      category: 'Location Guide',
      tags: ['south delhi areas', 'best locations south delhi', 'real estate investment'],
      publishedAt: '2024-01-10',
      readTime: 6,
      author: 'Property Expert',
      image: '/blog/best-areas-south-delhi.jpg'
    },
    {
      id: '3',
      title: 'South Delhi Real Estate Market Trends 2024',
      slug: 'south-delhi-real-estate-market-trends-2024',
      excerpt: 'Latest trends and insights in South Delhi real estate market. Price analysis, demand patterns, and investment opportunities in premium properties.',
      content: 'Full content here...',
      category: 'Market Analysis',
      tags: ['south delhi realty', 'market trends', 'property prices'],
      publishedAt: '2024-01-05',
      readTime: 10,
      author: 'Market Analyst',
      image: '/blog/market-trends-2024.jpg'
    },
    {
      id: '4',
      title: 'Luxury Apartments vs Independent Houses in South Delhi',
      slug: 'luxury-apartments-vs-independent-houses-south-delhi',
      excerpt: 'Compare luxury apartments and independent houses in South Delhi. Pros, cons, investment potential, and which option suits your lifestyle and budget.',
      content: 'Full content here...',
      category: 'Property Types',
      tags: ['luxury apartments', 'independent houses', 'property comparison'],
      publishedAt: '2024-01-01',
      readTime: 7,
      author: 'Property Consultant',
      image: '/blog/apartments-vs-houses.jpg'
    },
    {
      id: '5',
      title: 'Property Investment Guide: ROI in South Delhi Real Estate',
      slug: 'property-investment-guide-roi-south-delhi-real-estate',
      excerpt: 'Comprehensive guide to property investment in South Delhi. Calculate ROI, understand market dynamics, and make informed investment decisions.',
      content: 'Full content here...',
      category: 'Investment',
      tags: ['property investment', 'roi calculation', 'south delhi investment'],
      publishedAt: '2023-12-25',
      readTime: 12,
      author: 'Investment Expert',
      image: '/blog/investment-guide.jpg'
    },
    {
      id: '6',
      title: 'Complete Guide to Renting Properties in South Delhi',
      slug: 'complete-guide-renting-properties-south-delhi',
      excerpt: 'Everything you need to know about renting properties in South Delhi. Rental rates, best areas, tenant rights, and expert tips.',
      content: 'Full content here...',
      category: 'Rental Guide',
      tags: ['rental properties', 'rent in south delhi', 'tenant guide'],
      publishedAt: '2023-12-20',
      readTime: 9,
      author: 'Rental Expert',
      image: '/blog/rental-guide.jpg'
    }
  ];

  const categories = ['all', 'Buying Guide', 'Location Guide', 'Market Analysis', 'Property Types', 'Investment', 'Rental Guide'];

  useEffect(() => {
    // Simulate API call
    setBlogPosts(staticBlogPosts);
    setIsLoading(false);
  }, []);

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = blogPosts[0];

  return (
    <>
      <SEOHead
        title="South Delhi Property Blog | Real Estate Tips & Market Insights"
        description="Expert insights on South Delhi properties, real estate market trends, buying guides, and investment tips. Get the latest updates on properties in South Delhi from industry experts."
        keywords="south delhi property blog, real estate blog, property market insights, south delhi realty news, property investment tips, real estate trends south delhi, property buying guide"
        url="https://southdelhirealty.com/blog"
        type="website"
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                  South Delhi Property <span className="text-yellow-400">Blog</span>
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-blue-100">
                  Expert insights, market trends, and comprehensive guides for South Delhi real estate
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <TrendingUp className="h-5 w-5" />
                    <span>Market Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <Home className="h-5 w-5" />
                    <span>Property Guides</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                    <span>Location Insights</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Post */}
          {featuredPost && (
            <section className="py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-3xl font-bold mb-8 text-center">Featured Article</h2>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="md:flex">
                      <div className="md:w-1/2">
                        <img 
                          src={featuredPost.image} 
                          alt={featuredPost.title}
                          className="w-full h-64 md:h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/sdrlogo.png';
                          }}
                        />
                      </div>
                      <div className="md:w-1/2 p-8">
                        <div className="flex items-center gap-4 mb-4">
                          <Badge variant="secondary">{featuredPost.category}</Badge>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(featuredPost.publishedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {featuredPost.readTime} min read
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4">{featuredPost.title}</h3>
                        <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-1" />
                            {featuredPost.author}
                          </div>
                          <Button asChild>
                            <Link to={`/blog/${featuredPost.slug}`}>
                              Read More <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </section>
          )}

          {/* Category Filter */}
          <section className="py-8 bg-white sticky top-16 z-10 border-b">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category === 'all' ? 'All Articles' : category}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Blog Posts Grid */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                {isLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.slice(1).map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                        <div className="relative">
                          <img 
                            src={post.image} 
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/sdrlogo.png';
                            }}
                          />
                          <Badge className="absolute top-4 left-4" variant="secondary">
                            {post.category}
                          </Badge>
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {post.readTime} min
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-1" />
                              {post.author}
                            </div>
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/blog/${post.slug}`}>
                                Read More <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="py-16 bg-primary text-white">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Stay Updated with South Delhi Property Market
                </h2>
                <p className="text-xl mb-8 text-blue-100">
                  Get weekly insights, market updates, and exclusive property listings delivered to your inbox
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-lg text-black"
                  />
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3">
                    Subscribe
                  </Button>
                </div>
                <p className="text-sm text-blue-200 mt-4">
                  Weekly updates • No spam • Unsubscribe anytime
                </p>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
} 