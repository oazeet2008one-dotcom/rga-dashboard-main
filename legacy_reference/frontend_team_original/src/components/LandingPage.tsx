import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Zap, 
  Shield, 
  Globe, 
  Smartphone,
  Facebook,
  Search,
  MessageCircle,
  Music,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Star,
  Target,
  PieChart,
  Activity,
  Sparkles
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: 'Real-time analytics',
      description: 'Track sales, ROI, and KPIs from every platform inside one workspace.'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: 'AI trend insights',
      description: 'Our AI engine highlights opportunities and recommends the next best marketing action.'
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: 'Team management',
      description: 'Role-based access with Super Admin, Admin, and User levels.'
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: 'Enterprise-grade security',
      description: 'Bank-level protection with MFA enforced across every workspace.'
    },
    {
      icon: <Globe className="h-8 w-8 text-indigo-600" />,
      title: 'Multi-channel integrations',
      description: 'Connect Facebook, Google Ads, LINE, TikTok, Shopee, and more.'
    },
    {
      icon: <Smartphone className="h-8 w-8 text-orange-600" />,
      title: "Responsive Design",
      description: "Works on all devices, including mobile, tablet, and computer."
    }
  ];

  const platforms = [
    { name: "Facebook Ads", icon: <Facebook className="h-6 w-6" />, color: "bg-blue-500" },
    { name: "Google Ads", icon: <Search className="h-6 w-6" />, color: "bg-green-500" },
    { name: "LINE Official", icon: <MessageCircle className="h-6 w-6" />, color: "bg-green-600" },
    { name: "TikTok Business", icon: <Music className="h-6 w-6" />, color: "bg-black" },
    { name: "Shopee", icon: <ShoppingBag className="h-6 w-6" />, color: "bg-orange-500" }
  ];

  const stats = [
    { label: 'Active users', value: '10,000+', icon: <Users className="h-5 w-5" /> },
    { label: 'Total revenue', value: 'THB 50M+', icon: <ShoppingCart className="h-5 w-5" /> },
    { label: 'Campaigns launched', value: '25,000+', icon: <Target className="h-5 w-5" /> },
    { label: 'Average ROI', value: '300%', icon: <TrendingUp className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                RGA Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200">
              <Sparkles className="h-4 w-4 mr-1" />
              The most advanced digital marketing intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Analyze every channel
              </span>
              <br />
              <span className="text-gray-800">in one unified dashboard</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Bring Facebook Ads, Google Ads, LINE, TikTok, and Shopee data into a single AI-powered view that boosts revenue and
              lowers acquisition costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3"
              >
                Start for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-3 border-2 hover:bg-gray-50"
              >
                Log in
                <Activity className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Connect with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">every platform</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plug into every major digital advertising and commerce network.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {platforms.map((platform, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className={`${platform.color} p-4 rounded-full inline-flex items-center justify-center text-white mb-4`}>
                    {platform.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Feature set <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">designed for scale</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything teams need to analyze, optimize, and automate digital growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Launch RGA Dashboard today and unlock real-time revenue intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 font-semibold"
            >
              Start free 14-day trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/contact')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3"
            >
              Talk to sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">RGA Dashboard</span>
              </div>
              <p className="text-gray-400">
                Modern, full-funnel marketing analytics for ambitious growth teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Acceptable Use</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400">
            <p>&copy; 2025 RGA Dashboard. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/terms" className="text-sm hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="text-sm hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-sm hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
