'use client';

import { useState } from 'react';

const WEBSITE_TEMPLATES = [
  {
    id: 'saas',
    name: 'SaaS Product',
    icon: '💻',
    category: 'Technology',
    sections: ['Hero', 'Features', 'Pricing', 'FAQ', 'CTA'],
    html: (data: any) => `
      <div style="font-family:sans-serif">
        <nav style="background:${data.primaryColor};padding:20px;color:white;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold">${data.brandName || 'SaaS'}</div>
          <div><a href="#" style="color:white;text-decoration:none;margin-left:20px">Features</a><a href="#" style="color:white;text-decoration:none;margin-left:20px">Pricing</a><a href="#" style="color:white;text-decoration:none;margin-left:20px">Docs</a><a href="#" style="background:white;color:${data.primaryColor};padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;margin-left:20px">Start Free</a></div>
        </nav>
        <div style="background:linear-gradient(135deg,${data.primaryColor},${data.secondaryColor});color:white;padding:100px 40px;text-align:center">
          <h1 style="font-size:52px;margin:0">${data.headline || 'Build Better Software Faster'}</h1>
          <p style="font-size:20px;margin:20px 0;opacity:0.9;max-width:600px;margin-left:auto;margin-right:auto">${data.subheadline || 'The all-in-one platform that helps teams ship products 10x faster'}</p>
          <div style="margin-top:30px;display:flex;gap:15px;justify-content:center">
            <a href="#" style="display:inline-block;background:white;color:${data.primaryColor};padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold">${data.ctaText || 'Start Free Trial'}</a>
            <a href="#" style="display:inline-block;border:2px solid white;color:white;padding:16px 32px;border-radius:8px;text-decoration:none">Watch Demo</a>
          </div>
        </div>
        <div style="padding:80px 40px;text-align:center;background:#f8f9fa">
          <h2 style="font-size:32px;margin-bottom:15px">Trusted by 10,000+ teams</h2>
          <div style="display:flex;justify-content:center;gap:40px;margin-top:30px;opacity:0.5">
            ${['Google','Microsoft','Stripe','Slack'].map(b => `<span style="font-size:18px;font-weight:bold">${b}</span>`).join('')}
          </div>
        </div>
        <div style="padding:80px 40px;max-width:1000px;margin:0 auto">
          <h2 style="text-align:center;font-size:32px;margin-bottom:40px">Everything you need</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px">
            ${[{icon:'⚡',title:'Lightning Fast',desc:'Sub-millisecond response times'},{icon:'🔒',title:'Enterprise Security',desc:'SOC2 compliant, SSO built-in'},{icon:'📊',title:'Real-time Analytics',desc:'Track everything that matters'},{icon:'🔄',title:'API First',desc:'RESTful APIs with webhooks'},{icon:'🌍',title:'Global CDN',desc:'200+ edge locations worldwide'},{icon:'💬',title:'24/7 Support',desc:'Expert help whenever you need it'}].map(f => `
              <div style="padding:30px;background:white;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05)">
                <div style="font-size:36px;margin-bottom:15px">${f.icon}</div>
                <h3 style="margin:0 0 10px">${f.title}</h3>
                <p style="color:#666;margin:0">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="padding:80px 40px;background:#1a1a2e;color:white">
          <h2 style="text-align:center;font-size:32px;margin-bottom:40px">Simple, transparent pricing</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px;max-width:900px;margin:0 auto">
            ${[{name:'Starter',price:'$29',features:['5 Users','10GB Storage','Email Support','Basic Analytics']},{name:'Pro',price:'$79',features:['Unlimited Users','100GB Storage','Priority Support','Advanced Analytics','API Access'],popular:true},{name:'Enterprise',price:'Custom',features:['Unlimited Everything','Dedicated Support','Custom Integrations','SLA Guarantee']}].map(p => `
              <div style="background:${p.popular ? data.primaryColor : '#16213e'};border-radius:12px;padding:30px;text-align:center;${p.popular ? 'transform:scale(1.05)' : ''}">
                ${p.popular ? '<span style="background:white;color:'+data.primaryColor+';padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold">MOST POPULAR</span>' : ''}
                <h3 style="margin:20px 0 10px">${p.name}</h3>
                <div style="font-size:40px;font-weight:bold;margin:20px 0">${p.price}<span style="font-size:16px;opacity:0.7">/mo</span></div>
                <ul style="list-style:none;padding:0;margin:0 0 30px">${p.features.map(f => `<li style="padding:8px 0">✓ ${f}</li>`).join('')}</ul>
                <a href="#" style="display:block;background:${p.popular ? 'white' : data.primaryColor};color:${p.popular ? data.primaryColor : 'white'};padding:14px;border-radius:8px;text-decoration:none;font-weight:bold">Get Started</a>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="padding:80px 40px;text-align:center">
          <h2 style="font-size:32px;margin-bottom:20px">Ready to get started?</h2>
          <p style="color:#666;margin-bottom:30px">Start your free 14-day trial. No credit card required.</p>
          <a href="#" style="display:inline-block;background:${data.primaryColor};color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold">${data.ctaText || 'Start Free Trial'}</a>
        </div>
        <footer style="background:#333;color:white;padding:60px 40px">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px;max-width:1000px;margin:0 auto">
            <div><h4 style="margin-bottom:15px">${data.brandName || 'SaaS'}</h4><p style="color:#aaa;font-size:14px">Building the future of software development.</p></div>
            ${[{title:'Product',links:['Features','Pricing','Changelog','Roadmap']},{title:'Company',links:['About','Blog','Careers','Press']},{title:'Legal',links:['Privacy','Terms','Security','GDPR']}].map(c => `
              <div><h4 style="margin-bottom:15px">${c.title}</h4>${c.links.map(l => `<a href="#" style="display:block;color:#aaa;text-decoration:none;padding:4px 0;font-size:14px">${l}</a>`).join('')}</div>
            `).join('')}
          </div>
          <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #444;color:#aaa;font-size:14px">© ${new Date().getFullYear()} ${data.brandName || 'SaaS'}. All rights reserved.</div>
        </footer>
      </div>`
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    icon: '🛒',
    category: 'Retail',
    sections: ['Hero', 'Products', 'Categories', 'Testimonials', 'Newsletter'],
    html: (data: any) => `
      <div style="font-family:sans-serif">
        <nav style="background:white;border-bottom:1px solid #eee;padding:20px 40px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold;color:${data.primaryColor}">${data.brandName || 'Shop'}</div>
          <div style="display:flex;gap:20px;align-items:center"><a href="#" style="color:#333;text-decoration:none">New Arrivals</a><a href="#" style="color:#333;text-decoration:none">Categories</a><a href="#" style="color:#333;text-decoration:none">Sale</a><a href="#" style="color:#333;text-decoration:none">🛒 Cart (0)</a></div>
        </nav>
        <div style="background:linear-gradient(135deg,${data.primaryColor},${data.secondaryColor});color:white;padding:100px 40px;text-align:center">
          <h1 style="font-size:52px;margin:0">${data.headline || 'Summer Collection 2024'}</h1>
          <p style="font-size:20px;margin:20px 0;opacity:0.9">${data.subheadline || 'Discover the latest trends in fashion'}</p>
          <a href="#" style="display:inline-block;background:white;color:${data.primaryColor};padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px">${data.ctaText || 'Shop Now'}</a>
        </div>
        <div style="padding:60px 40px;text-align:center">
          <h2 style="font-size:28px;margin-bottom:40px">Featured Products</h2>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1200px;margin:0 auto">
            ${[1,2,3,4].map(i => `
              <div style="border:1px solid #eee;border-radius:12px;overflow:hidden">
                <div style="height:250px;background:linear-gradient(135deg,${data.primaryColor}20,${data.secondaryColor}20);display:flex;align-items:center;justify-content:center;font-size:48px">🛍️</div>
                <div style="padding:20px">
                  <span style="color:${data.primaryColor};font-size:12px;text-transform:uppercase">Category</span>
                  <h3 style="margin:5px 0">Product Name ${i}</h3>
                  <p style="font-size:18px;font-weight:bold;color:${data.primaryColor}">$${(i+1)*24}.99</p>
                  <button style="width:100%;margin-top:10px;padding:10px;background:${data.primaryColor};color:white;border:none;border-radius:6px;cursor:pointer">Add to Cart</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="background:#f8f9fa;padding:60px 40px;text-align:center">
          <h2 style="font-size:28px;margin-bottom:30px">Get 10% Off Your First Order</h2>
          <p style="color:#666;margin-bottom:20px">Subscribe to our newsletter for exclusive deals</p>
          <div style="display:flex;max-width:400px;margin:0 auto">
            <input type="email" placeholder="Enter your email" style="flex:1;padding:14px 20px;border:1px solid #ddd;border-radius:8px 0 0 8px;font-size:16px">
            <button style="background:${data.primaryColor};color:white;border:none;padding:14px 24px;border-radius:0 8px 8px 0;cursor:pointer;font-weight:bold">Subscribe</button>
          </div>
        </div>
        <footer style="background:#333;color:white;padding:60px 40px">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px;max-width:1000px;margin:0 auto">
            <div><h4 style="margin-bottom:15px">${data.brandName || 'Shop'}</h4><p style="color:#aaa;font-size:14px">Premium quality products for everyone.</p></div>
            ${[{title:'Shop',links:['New Arrivals','Best Sellers','Sale','Gift Cards']},{title:'Help',links:['FAQ','Shipping','Returns','Track Order']},{title:'Connect',links:['Instagram','Twitter','Facebook','Pinterest']}].map(c => `
              <div><h4 style="margin-bottom:15px">${c.title}</h4>${c.links.map(l => `<a href="#" style="display:block;color:#aaa;text-decoration:none;padding:4px 0;font-size:14px">${l}</a>`).join('')}</div>
            `).join('')}
          </div>
        </footer>
      </div>`
  },
  {
    id: 'event',
    name: 'Event / Conference',
    icon: '🎪',
    category: 'Events',
    sections: ['Hero', 'Speakers', 'Schedule', 'Tickets', 'Sponsors'],
    html: (data: any) => `
      <div style="font-family:sans-serif;background:#0f0f23;color:white">
        <nav style="padding:20px 40px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold;color:${data.primaryColor}">${data.brandName || 'Event'}</div>
          <div style="display:flex;gap:20px;align-items:center"><a href="#" style="color:white;text-decoration:none">Speakers</a><a href="#" style="color:white;text-decoration:none">Schedule</a><a href="#" style="background:${data.primaryColor};color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Get Tickets</a></div>
        </nav>
        <div style="text-align:center;padding:120px 40px">
          <span style="background:${data.primaryColor}30;color:${data.primaryColor};padding:8px 20px;border-radius:20px;font-size:14px;text-transform:uppercase">March 15-17, 2024</span>
          <h1 style="font-size:64px;margin:30px 0;background:linear-gradient(135deg,${data.primaryColor},${data.secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${data.headline || 'TechSummit 2024'}</h1>
          <p style="font-size:20px;color:#aaa;max-width:600px;margin:0 auto">${data.subheadline || 'Join 5,000+ developers for 3 days of learning, networking, and innovation'}</p>
          <a href="#" style="display:inline-block;background:${data.primaryColor};color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:30px">${data.ctaText || 'Register Now - $299'}</a>
        </div>
        <div style="padding:80px 40px;max-width:1000px;margin:0 auto">
          <h2 style="text-align:center;font-size:32px;margin-bottom:40px">Featured Speakers</h2>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
            ${['👩‍💻','👨‍💻','👩‍🔬','👨‍🎨'].map((e,i) => `
              <div style="text-align:center;padding:20px;background:#16213e;border-radius:12px">
                <div style="width:100px;height:100px;border-radius:50%;background:${data.primaryColor}30;margin:0 auto 15px;display:flex;align-items:center;justify-content:center;font-size:40px">${e}</div>
                <h3 style="margin:0 0 5px">Speaker ${i+1}</h3>
                <p style="color:#aaa;margin:0;font-size:14px">CTO at TechCorp</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="padding:80px 40px;background:#16213e">
          <h2 style="text-align:center;font-size:32px;margin-bottom:40px">Ticket Options</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px;max-width:900px;margin:0 auto">
            ${[{name:'Early Bird',price:'$199',color:'#10b981'},{name:'Regular',price:'$299',color:data.primaryColor,popular:true},{name:'VIP',price:'$499',color:'#f59e0b'}].map(t => `
              <div style="background:#0f0f23;border-radius:12px;padding:30px;text-align:center;border:2px solid ${t.popular ? t.color : '#333'}">
                ${t.popular ? '<span style="background:'+t.color+';color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold">RECOMMENDED</span>' : ''}
                <h3 style="margin:20px 0 10px">${t.name}</h3>
                <div style="font-size:48px;font-weight:bold;color:${t.color};margin:20px 0">${t.price}</div>
                <ul style="list-style:none;padding:0;text-align:left;margin:0 0 30px;color:#aaa">
                  <li style="padding:8px 0">✓ All Sessions</li>
                  <li style="padding:8px 0">✓ Networking Events</li>
                  ${t.name === 'VIP' ? '<li style="padding:8px 0">✓ VIP Lounge</li><li style="padding:8px 0">✓ Speaker Dinner</li>' : ''}
                </ul>
                <a href="#" style="display:block;background:${t.color};color:white;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold">Buy Now</a>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="padding:60px 40px;text-align:center">
          <p style="color:#aaa">Sponsored by</p>
          <div style="display:flex;justify-content:center;gap:40px;margin-top:20px;opacity:0.5">
            ${['Company A','Company B','Company C','Company D','Company E'].map(s => `<span style="font-size:16px;font-weight:bold">${s}</span>`).join('')}
          </div>
        </div>
      </div>`
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    icon: '🏠',
    category: 'Property',
    sections: ['Hero', 'Listings', 'Features', 'Agent', 'Contact'],
    html: (data: any) => `
      <div style="font-family:sans-serif">
        <nav style="background:white;border-bottom:1px solid #eee;padding:20px 40px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold;color:${data.primaryColor}">${data.brandName || 'Realty'}</div>
          <div style="display:flex;gap:20px;align-items:center"><a href="#" style="color:#333;text-decoration:none">Buy</a><a href="#" style="color:#333;text-decoration:none">Rent</a><a href="#" style="color:#333;text-decoration:none">Sell</a><a href="#" style="color:#333;text-decoration:none">Agents</a><a href="#" style="background:${data.primaryColor};color:white;padding:10px 20px;border-radius:6px;text-decoration:none">List Property</a></div>
        </nav>
        <div style="background:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url('https://picsum.photos/1400/600?random=1');background-size:cover;color:white;padding:120px 40px;text-align:center">
          <h1 style="font-size:52px;margin:0">${data.headline || 'Find Your Dream Home'}</h1>
          <p style="font-size:20px;margin:20px 0">${data.subheadline || 'Browse thousands of properties for sale and rent'}</p>
          <div style="background:white;padding:20px;border-radius:12px;max-width:800px;margin:30px auto 0;display:flex;gap:10px">
            <input type="text" placeholder="Location" style="flex:1;padding:14px;border:1px solid #ddd;border-radius:8px;font-size:16px">
            <select style="padding:14px;border:1px solid #ddd;border-radius:8px;font-size:16px"><option>Buy</option><option>Rent</option></select>
            <button style="background:${data.primaryColor};color:white;border:none;padding:14px 30px;border-radius:8px;cursor:pointer;font-weight:bold">Search</button>
          </div>
        </div>
        <div style="padding:80px 40px;max-width:1200px;margin:0 auto">
          <h2 style="font-size:28px;margin-bottom:40px">Featured Properties</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">
            ${[1,2,3].map(i => `
              <div style="border:1px solid #eee;border-radius:12px;overflow:hidden">
                <div style="height:200px;background:linear-gradient(135deg,${data.primaryColor}20,${data.secondaryColor}20);display:flex;align-items:center;justify-content:center;font-size:48px">🏠</div>
                <div style="padding:20px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="background:${data.primaryColor}20;color:${data.primaryColor};padding:4px 10px;border-radius:4px;font-size:12px;font-weight:bold">For Sale</span>
                    <span style="font-size:12px;color:#999">⭐ 4.${i}</span>
                  </div>
                  <h3 style="margin:10px 0 5px">Modern Villa ${i}</h3>
                  <p style="color:#666;margin:0;font-size:14px">📍 Downtown Area</p>
                  <div style="display:flex;gap:15px;margin-top:10px;color:#666;font-size:14px">
                    <span>🛏️ ${i+2} Beds</span><span>🚿 ${i+1} Baths</span><span>📐 ${(i+1)*500} sqft</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:15px;padding-top:15px;border-top:1px solid #eee">
                    <span style="font-size:22px;font-weight:bold;color:${data.primaryColor}">$${(i+2)}50,000</span>
                    <a href="#" style="color:${data.primaryColor};text-decoration:none;font-weight:500">View Details →</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="padding:80px 40px;background:#f8f9fa">
          <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center">
            ${[{icon:'🏠',num:'500+',label:'Properties'},{icon:'👥',num:'200+',label:'Happy Clients'},{icon:'📍',num:'50+',label:'Locations'},{icon:'🏆',num:'10+',label:'Awards'}].map(s => `
              <div style="padding:20px"><div style="font-size:36px;margin-bottom:10px">${s.icon}</div><div style="font-size:32px;font-weight:bold;color:${data.primaryColor}">${s.num}</div><div style="color:#666">${s.label}</div></div>
            `).join('')}
          </div>
        </div>
        <div style="padding:80px 40px;text-align:center">
          <h2 style="font-size:28px;margin-bottom:20px">Ready to Find Your Home?</h2>
          <p style="color:#666;margin-bottom:30px">Let our experts help you find the perfect property</p>
          <a href="#" style="display:inline-block;background:${data.primaryColor};color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold">${data.ctaText || 'Contact an Agent'}</a>
        </div>
        <footer style="background:#333;color:white;padding:60px 40px">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:30px;max-width:1000px;margin:0 auto">
            <div><h4 style="margin-bottom:15px">${data.brandName || 'Realty'}</h4><p style="color:#aaa;font-size:14px">Your trusted partner in finding the perfect home.</p></div>
            ${[{title:'Properties',links:['Buy','Rent','Sell','Commercial']},{title:'Company',links:['About','Agents','Careers','Blog']},{title:'Support',links:['Contact','FAQ','Terms','Privacy']}].map(c => `
              <div><h4 style="margin-bottom:15px">${c.title}</h4>${c.links.map(l => `<a href="#" style="display:block;color:#aaa;text-decoration:none;padding:4px 0;font-size:14px">${l}</a>`).join('')}</div>
            `).join('')}
          </div>
        </footer>
      </div>`
  },
  {
    id: 'landing',
    name: 'Landing Page',
    icon: '🚀',
    category: 'Business',
    sections: ['Hero', 'Features', 'Pricing', 'Testimonials', 'CTA'],
    html: (data: any) => `
      <div style="font-family:sans-serif">
        <nav style="background:${data.primaryColor};padding:20px;color:white;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold">${data.brandName || 'Brand'}</div>
          <div><a href="#" style="color:white;text-decoration:none;margin-left:20px">Features</a><a href="#" style="color:white;text-decoration:none;margin-left:20px">Pricing</a><a href="#" style="color:white;text-decoration:none;margin-left:20px">Contact</a></div>
        </nav>
        <div style="background:linear-gradient(135deg,${data.primaryColor},${data.secondaryColor});color:white;padding:100px 40px;text-align:center">
          <h1 style="font-size:48px;margin:0">${data.headline || 'Your Headline Here'}</h1>
          <p style="font-size:20px;margin:20px 0;opacity:0.9">${data.subheadline || 'Your subheadline goes here'}</p>
          <a href="#" style="display:inline-block;background:white;color:${data.primaryColor};padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px">${data.ctaText || 'Get Started'}</a>
        </div>
        <div style="padding:80px 40px;text-align:center">
          <h2 style="font-size:32px;margin-bottom:40px">Features</h2>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:30px;max-width:1000px;margin:0 auto">
            ${[1,2,3].map(i => `
              <div style="padding:30px;border:1px solid #eee;border-radius:12px">
                <div style="font-size:40px;margin-bottom:15px">${['⚡','🛡️','🚀'][i-1]}</div>
                <h3 style="margin:0 0 10px">Feature ${i}</h3>
                <p style="color:#666;margin:0">Description of feature ${i} goes here.</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="background:#f8f9fa;padding:60px 40px;text-align:center">
          <h2 style="font-size:32px;margin-bottom:20px">Ready to Start?</h2>
          <p style="color:#666;margin-bottom:30px">Join thousands of happy customers</p>
          <a href="#" style="display:inline-block;background:${data.primaryColor};color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold">${data.ctaText || 'Get Started'}</a>
        </div>
        <footer style="background:#333;color:white;padding:40px;text-align:center">
          <p style="margin:0">© ${new Date().getFullYear()} ${data.brandName || 'Brand'}. All rights reserved.</p>
        </footer>
      </div>`
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '🎨',
    category: 'Personal',
    sections: ['Hero', 'Projects', 'Skills', 'Contact'],
    html: (data: any) => `
      <div style="font-family:sans-serif;background:#1a1a2e;color:white">
        <nav style="padding:20px 40px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold">${data.brandName || 'Portfolio'}</div>
          <div><a href="#" style="color:white;text-decoration:none;margin-left:20px">Work</a><a href="#" style="color:white;text-decoration:none;margin-left:20px">About</a><a href="#" style="color:white;text-decoration:none;margin-left:20px">Contact</a></div>
        </nav>
        <div style="padding:100px 40px;text-align:center">
          <h1 style="font-size:56px;margin:0;background:linear-gradient(135deg,${data.primaryColor},${data.secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent">${data.name || 'Your Name'}</h1>
          <p style="font-size:20px;margin:20px 0;color:#aaa">${data.title || 'Creative Developer'}</p>
        </div>
        <div style="padding:60px 40px;max-width:1000px;margin:0 auto">
          <h2 style="text-align:center;margin-bottom:40px">Featured Projects</h2>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
            ${[1,2,3,4].map(i => `
              <div style="background:#16213e;border-radius:12px;overflow:hidden">
                <div style="height:200px;background:linear-gradient(135deg,${data.primaryColor}40,${data.secondaryColor}40)"></div>
                <div style="padding:20px">
                  <h3 style="margin:0 0 10px">Project ${i}</h3>
                  <p style="color:#aaa;margin:0">Brief description of the project</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="padding:60px 40px;text-align:center;border-top:1px solid #333">
          <h2>Get In Touch</h2>
          <p style="color:#aaa;margin:20px 0">Have a project in mind? Let's talk.</p>
          <a href="#" style="display:inline-block;background:${data.primaryColor};color:white;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold">Contact Me</a>
        </div>
      </div>`
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍕',
    category: 'Food',
    sections: ['Hero', 'Menu', 'About', 'Contact'],
    html: (data: any) => `
      <div style="font-family:sans-serif">
        <nav style="background:#2c1810;padding:20px 40px;color:#d4a574;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold">${data.brandName || 'Restaurant'}</div>
          <div><a href="#" style="color:#d4a574;text-decoration:none;margin-left:20px">Menu</a><a href="#" style="color:#d4a574;text-decoration:none;margin-left:20px">About</a><a href="#" style="color:#d4a574;text-decoration:none;margin-left:20px">Reserve</a></div>
        </nav>
        <div style="background:linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url('https://picsum.photos/1200/600?random=1');background-size:cover;color:white;padding:120px 40px;text-align:center">
          <h1 style="font-size:56px;margin:0;font-family:Georgia,serif">${data.brandName || 'Restaurant'}</h1>
          <p style="font-size:20px;margin:20px 0;opacity:0.9">Fine Dining Experience</p>
          <a href="#" style="display:inline-block;background:#d4a574;color:#2c1810;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px">Reserve Table</a>
        </div>
        <div style="padding:80px 40px;max-width:1000px;margin:0 auto">
          <h2 style="text-align:center;font-family:Georgia,serif;margin-bottom:40px">Our Menu</h2>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:30px">
            ${['Appetizer','Main Course','Dessert','Beverage'].map((item,i) => `
              <div style="display:flex;gap:15px;padding:20px;border-bottom:1px solid #eee">
                <img src="https://picsum.photos/100/100?random=${i+2}" style="width:80px;height:80px;border-radius:8px;object-fit:cover">
                <div>
                  <h3 style="margin:0 0 5px">${item}</h3>
                  <p style="color:#666;margin:0;font-size:14px">Delicious ${item.toLowerCase()} made with fresh ingredients</p>
                  <p style="color:${data.primaryColor};font-weight:bold;margin:5px 0 0">$${(i+1)*8}.99</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <footer style="background:#2c1810;color:#d4a574;padding:40px;text-align:center">
          <p style="margin:0">© ${new Date().getFullYear()} ${data.brandName || 'Restaurant'}. All rights reserved.</p>
        </footer>
      </div>`
  },
  {
    id: 'blog',
    name: 'Blog',
    icon: '📝',
    category: 'Content',
    sections: ['Header', 'Posts', 'Sidebar', 'Footer'],
    html: (data: any) => `
      <div style="font-family:sans-serif">
        <nav style="border-bottom:1px solid #eee;padding:20px 40px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:24px;font-weight:bold">${data.brandName || 'Blog'}</div>
          <div><a href="#" style="color:#333;text-decoration:none;margin-left:20px">Home</a><a href="#" style="color:#333;text-decoration:none;margin-left:20px">Articles</a><a href="#" style="color:#333;text-decoration:none;margin-left:20px">About</a></div>
        </nav>
        <div style="padding:40px;max-width:1000px;margin:0 auto">
          <div style="display:grid;grid-template-columns:2fr 1fr;gap:40px">
            <div>
              <h2 style="margin-bottom:30px">Latest Articles</h2>
              ${[1,2,3].map(i => `
                <article style="margin-bottom:30px;padding-bottom:30px;border-bottom:1px solid #eee">
                  <img src="https://picsum.photos/800/400?random=${i+10}" style="width:100%;height:200px;object-fit:cover;border-radius:8px;margin-bottom:15px">
                  <span style="color:${data.primaryColor};font-size:12px;text-transform:uppercase">Category ${i}</span>
                  <h3 style="margin:10px 0">Blog Post Title ${i}</h3>
                  <p style="color:#666;margin:10px 0">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore...</p>
                  <a href="#" style="color:${data.primaryColor};text-decoration:none;font-weight:500">Read More →</a>
                </article>
              `).join('')}
            </div>
            <aside>
              <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin-bottom:20px">
                <h3 style="margin:0 0 15px">Search</h3>
                <input type="text" placeholder="Search articles..." style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px">
              </div>
              <div style="background:#f8f9fa;padding:20px;border-radius:8px">
                <h3 style="margin:0 0 15px">Categories</h3>
                <ul style="list-style:none;padding:0;margin:0">
                  <li style="padding:8px 0;border-bottom:1px solid #eee">Technology</li>
                  <li style="padding:8px 0;border-bottom:1px solid #eee">Design</li>
                  <li style="padding:8px 0;border-bottom:1px solid #eee">Business</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
        <footer style="background:#333;color:white;padding:40px;text-align:center">
          <p style="margin:0">© ${new Date().getFullYear()} ${data.brandName || 'Blog'}. All rights reserved.</p>
        </footer>
      </div>`
  }
];

export default function LocalWebsiteGenerator() {
  const [data, setData] = useState({
    brandName: '',
    headline: '',
    subheadline: '',
    ctaText: 'Get Started',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    name: '',
    title: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState('landing');
  const [activeTab, setActiveTab] = useState<'select' | 'customize' | 'preview'>('select');

  const template = WEBSITE_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Website Generator</h2>
        <p className="text-zinc-400">Create websites instantly from templates - no AI needed</p>
      </div>

      <div className="flex gap-2">
        {['select', 'customize', 'preview'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-violet-600' : 'bg-zinc-700'}`}>
            {tab === 'select' ? '📋 Templates' : tab === 'customize' ? '✏️ Customize' : '👁️ Preview'}
          </button>
        ))}
      </div>

      {activeTab === 'select' && (
        <div className="grid md:grid-cols-2 gap-4">
          {WEBSITE_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplate(t.id); setActiveTab('customize'); }}
              className={`bg-zinc-900/50 border rounded-xl p-6 text-left hover:border-zinc-700 transition-all ${selectedTemplate === t.id ? 'border-violet-500' : 'border-zinc-800'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <span className="text-xs bg-zinc-700 px-2 py-1 rounded">{t.category}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.sections.map(s => (
                  <span key={s} className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">{s}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'customize' && template && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Customize {template.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Brand Name *</label>
                <input type="text" value={data.brandName} onChange={(e) => setData(prev => ({ ...prev, brandName: e.target.value }))} placeholder="Your Brand" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              {selectedTemplate === 'portfolio' && (
                <>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Your Name</label>
                    <input type="text" value={data.name} onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))} placeholder="John Doe" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Your Title</label>
                    <input type="text" value={data.title} onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))} placeholder="Creative Developer" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  </div>
                </>
              )}
              {selectedTemplate === 'landing' && (
                <>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Headline</label>
                    <input type="text" value={data.headline} onChange={(e) => setData(prev => ({ ...prev, headline: e.target.value }))} placeholder="Your Main Headline" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Subheadline</label>
                    <input type="text" value={data.subheadline} onChange={(e) => setData(prev => ({ ...prev, subheadline: e.target.value }))} placeholder="Your subheadline goes here" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">CTA Button Text</label>
                <input type="text" value={data.ctaText} onChange={(e) => setData(prev => ({ ...prev, ctaText: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={data.primaryColor} onChange={(e) => setData(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={data.primaryColor} onChange={(e) => setData(prev => ({ ...prev, primaryColor: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={data.secondaryColor} onChange={(e) => setData(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-10 h-10 rounded" />
                    <input type="text" value={data.secondaryColor} onChange={(e) => setData(prev => ({ ...prev, secondaryColor: e.target.value }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm" />
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveTab('preview')} className="w-full bg-violet-600 hover:bg-violet-700 py-2 rounded-lg font-medium">
                Preview Website →
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Template Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden">
              <iframe srcDoc={template.html(data)} className="w-full h-[500px] border-0" title="Preview" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && template && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{template.name} - Full Preview</h3>
            <div className="flex gap-2">
              <button onClick={() => { const blob = new Blob([template.html(data)], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${(data.brandName || 'website').toLowerCase().replace(/\s+/g, '-')}.html`; a.click(); }} className="px-3 py-1 bg-violet-600 hover:bg-violet-700 rounded text-sm">💾 Download HTML</button>
            </div>
          </div>
          <iframe srcDoc={template.html(data)} className="w-full h-[700px] bg-white rounded-lg" title="Full Preview" />
        </div>
      )}
    </div>
  );
}
