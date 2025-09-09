# Digitat Mart 🛒

A modern e-commerce web application built with React, Firebase, and Tailwind CSS. Digitat Mart provides a seamless shopping experience with user authentication, product management, and shopping cart functionality.

## ✨ Features

- **User Authentication**: Sign up, sign in, and user profile management
- **Product Catalog**: Browse and search through a wide range of products
- **Shopping Cart**: Add/remove items, update quantities, and manage cart
- **Product Management**: Add new products with images, descriptions, and categories
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Firebase integration for real-time data synchronization
- **Modern UI**: Beautiful interface built with Tailwind CSS and Lucide React icons

## 🚀 Tech Stack

- **Frontend**: React 19.1.1
- **Styling**: Tailwind CSS 3.4.17
- **Backend**: Firebase (Firestore, Authentication)
- **Icons**: Lucide React
- **Build Tool**: Vite 7.1.2
- **Package Manager**: npm

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Krishmodi33/react_digitalmart.git
   cd react_digitalmart
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore Database
   - Copy your Firebase configuration and update `src/firebase.js`

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── App.jsx              # Main application component
├── App.css              # Global styles
├── main.jsx             # Application entry point
├── firebase.js          # Firebase configuration
├── FirebaseService.js   # Firebase service layer
├── CartService.js       # Shopping cart service
├── AddProduct.jsx       # Product creation form
├── ProductCard.jsx      # Individual product display
├── ProductsPage.jsx     # Products listing page
└── index.css            # Base styles
```

## 🔥 Firebase Setup

1. **Authentication Setup**

   - Enable Email/Password authentication in Firebase Console
   - Configure authorized domains

2. **Firestore Database**

   - Create a Firestore database
   - Set up the following collections:
     - `products` - Store product information
     - `users` - Store user profiles
     - `carts` - Store user cart data

3. **Security Rules**
   ```javascript
   // Firestore Security Rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🎨 Key Components

### App.jsx

Main application component that handles:

- User authentication state
- Shopping cart management
- Product data fetching
- Navigation and routing

### AddProduct.jsx

Form component for adding new products with:

- Product name, price, category
- Image URL and description
- Form validation and error handling

### ProductCard.jsx

Individual product display with:

- Product image and details
- Add to cart functionality
- Responsive design

### FirebaseService.js

Service layer for Firebase operations:

- User authentication methods
- Product CRUD operations
- Cart management functions

## 🛒 Usage

1. **Sign Up/Sign In**: Create an account or sign in to access the full features
2. **Browse Products**: View the product catalog with search and filter options
3. **Add to Cart**: Click the cart icon on any product to add it to your cart
4. **Manage Cart**: View cart items, update quantities, or remove items
5. **Add Products**: Use the "Add Product" form to add new items to the catalog

## 🎯 Features in Detail

### Authentication

- Secure user registration and login
- User profile management
- Protected routes and components

### Product Management

- Add products with images, descriptions, and categories
- Real-time product updates
- Search and filter functionality

### Shopping Cart

- Add/remove items
- Update quantities
- Persistent cart data
- Cart total calculation

## 🚀 Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel: `vercel --prod`
   - Netlify: Drag and drop the `dist` folder
   - Firebase Hosting: `firebase deploy`

- GitHub: [@Krishmodi33](https://github.com/Krishmodi33)

## 🙏 Acknowledgments

- Firebase for backend services
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Lucide React for beautiful icons

---

⭐ Star this repository if you found it helpful!
