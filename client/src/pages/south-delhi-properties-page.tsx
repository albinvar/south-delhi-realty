import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import PropertyCard from "@/components/properties/property-card";
import SEOHead, { generateOrganizationStructuredData } from "@/components/seo/seo-head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Home, Mail, MapPin, Phone, ShoppingCart, Star, TreePine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Property {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  area: number;
  areaUnit: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  status: string;
  media: any[];
  contactDetails: string;
}

export default function SouthDelhiPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    forSale: 0,
    forRent: 0,
    averagePrice: 0
  });

  const organizationStructuredData = generateOrganizationStructuredData();

  useEffect(() => {
    fetchProperties();
    fetchStats();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties?limit=12');
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/properties/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const southDelhiAreas = [
    { name: "Greater Kailash", slug: "greater-kailash", properties: "150+" },
    { name: "Defence Colony", slug: "defence-colony", properties: "120+" },
    { name: "Lajpat Nagar", slug: "lajpat-nagar", properties: "100+" },
    { name: "Khan Market", slug: "khan-market", properties: "80+" },
    { name: "Green Park", slug: "green-park", properties: "90+" },
    { name: "Hauz Khas", slug: "hauz-khas", properties: "110+" },
    { name: "Vasant Vihar", slug: "vasant-vihar", properties: "70+" },
    { name: "South Extension", slug: "south-extension", properties: "95+" }
  ];

  const propertyTypes = [
    { icon: Home, name: "Apartments", count: "200+", slug: "apartment" },
    { icon: Building, name: "Independent Houses", count: "150+", slug: "independent-house" },
    { icon: TreePine, name: "Villas", count: "80+", slug: "villa" },
    { icon: ShoppingCart, name: "Commercial", count: "60+", slug: "commercial" }
  ];

  return (
    <>
      <SEOHead
        title="South Delhi Properties - Premium Real Estate in South Delhi | South Delhi Realty"
        description="Explore premium South Delhi properties with South Delhi Realty. Find luxury apartments, independent houses, villas in Greater Kailash, Defence Colony, Lajpat Nagar. 500+ verified properties for sale and rent in South Delhi. Expert property consultants available."
        keywords="south delhi properties, properties in south delhi, south delhi realty, real estate south delhi, premium properties south delhi, luxury properties south delhi, apartments south delhi, independent houses south delhi, villas south delhi, commercial properties south delhi, property dealers south delhi, south delhi property portal"
        url="https://southdelhirealty.com/south-delhi-properties"
        type="website"
        structuredData={organizationStructuredData}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                  Premium <span className="text-yellow-400">South Delhi Properties</span>
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-blue-100">
                  Discover luxury apartments, independent houses, and villas in South Delhi's most prestigious locations
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span>4.8/5 Rating</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <Home className="h-5 w-5" />
                    <span>500+ Properties</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                    <span>15+ Locations</span>
                  </div>
                </div>
                <div className="space-x-4">
                  <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Link to="/properties">Browse All Properties</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-primary">
                    <Link to="/contact">Contact Expert</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose South Delhi Properties */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Why Choose South Delhi Properties?
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  South Delhi offers the perfect blend of luxury, convenience, and investment potential
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Prime Locations</h3>
                    <p className="text-gray-600">Greater Kailash, Defence Colony, Lajpat Nagar and more prestigious areas</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Building className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Luxury Living</h3>
                    <p className="text-gray-600">Premium apartments, independent houses, and luxury villas</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">High ROI</h3>
                    <p className="text-gray-600">Excellent appreciation potential and rental yields in South Delhi</p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Expert Service</h3>
                    <p className="text-gray-600">15+ years experience in South Delhi real estate market</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* South Delhi Areas */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Popular South Delhi Areas
                </h2>
                <p className="text-xl text-gray-600">
                  Explore properties in South Delhi's most sought-after locations
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {southDelhiAreas.map((area) => (
                  <Card key={area.slug} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{area.name}</h3>
                        <Badge variant="secondary">{area.properties}</Badge>
                      </div>
                      <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-white">
                        <Link to={`/properties?location=${area.slug}`}>
                          View Properties
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Property Types */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Property Types in South Delhi
                </h2>
                <p className="text-xl text-gray-600">
                  Find your perfect property type with South Delhi Realty
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {propertyTypes.map((type) => (
                  <Card key={type.slug} className="group hover:shadow-lg transition-shadow text-center">
                    <CardContent className="pt-8 pb-6">
                      <type.icon className="h-16 w-16 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
                      <Badge variant="outline" className="mb-4">{type.count}</Badge>
                      <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-white">
                        <Link to={`/properties?type=${type.slug}`}>
                          Explore {type.name}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Properties */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Featured South Delhi Properties
                </h2>
                <p className="text-xl text-gray-600">
                  Handpicked premium properties from our exclusive collection
                </p>
              </div>
              
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {properties.slice(0, 6).map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
              
              <div className="text-center mt-12">
                <Button asChild size="lg">
                  <Link to="/properties">View All Properties</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="py-16 bg-primary text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Find Your Dream Property in South Delhi?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Contact our expert property consultants for personalized assistance
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <a href="tel:+919911248822">
                    <Phone className="h-5 w-5 mr-2" />
                    Call +91-99112-48822
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-primary">
                  <a href="mailto:southdelhirealti@gmail.com">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Us
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
} 