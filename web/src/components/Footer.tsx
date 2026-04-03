import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-serif font-bold">C</span>
              </div>
              <span className="font-serif font-bold">Cypher of Healing</span>
            </div>
            <p className="text-dark-300 text-sm">
              The outer is a reflection of the inner.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif font-bold mb-4">The Chair</h3>
            <ul className="space-y-2 text-sm text-dark-300">
              <li>
                <Link to="/booking" className="hover:text-primary-400 transition">
                  Book Consultation
                </Link>
              </li>
              <li>
                <Link to="/booking/services" className="hover:text-primary-400 transition">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/booking/availability" className="hover:text-primary-400 transition">
                  Availability
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Links */}
          <div>
            <h3 className="font-serif font-bold mb-4">The Vault</h3>
            <ul className="space-y-2 text-sm text-dark-300">
              <li>
                <Link to="/store" className="hover:text-primary-400 transition">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/store/new" className="hover:text-primary-400 transition">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/store/featured" className="hover:text-primary-400 transition">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          {/* Learning Links */}
          <div>
            <h3 className="font-serif font-bold mb-4">The Academy</h3>
            <ul className="space-y-2 text-sm text-dark-300">
              <li>
                <Link to="/academy" className="hover:text-primary-400 transition">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/academy/beginner" className="hover:text-primary-400 transition">
                  For Beginners
                </Link>
              </li>
              <li>
                <Link to="/academy/advanced" className="hover:text-primary-400 transition">
                  Advanced
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-dark-400">
            <p>&copy; {currentYear} Cypher of Healing. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link to="#" className="hover:text-primary-400 transition">
                Privacy
              </Link>
              <Link to="#" className="hover:text-primary-400 transition">
                Terms
              </Link>
              <Link to="#" className="hover:text-primary-400 transition">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
