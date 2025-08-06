# Inventory & Quotation Portal - Streamline Your Business Operations 🚀

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.16-blue)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-latest-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-blue)](https://tailwindcss.com/)

**Take control of your inventory and quotations with this professionally designed portal!**

This Next.js-powered application provides a comprehensive solution for managing your products, creating accurate quotations, and gaining insights into your business performance. With user-friendly interfaces and robust features, it's built to streamline your operations and empower your team.

## ✨ Key Features

-   **Inventory Management:** Add, edit, and track your products with detailed information like name, price, quantity, and images. Get low stock alerts to prevent shortages.
-   **Quotation System:** Create and manage quotations efficiently, assign them to riders, and track their status. Generate professional-looking PDFs for easy sharing.
-   **User Roles & Permissions:** Secure your data with role-based access control. Managers have full access, while riders have limited access to quotations.
-   **Sales Dashboard:** Visualize your sales trends with interactive charts and key metrics like total revenue and number of quotations.
-   **Activity Logs:** Monitor all system activities and user actions for enhanced security and accountability.
-   **Mobile-First Design:** Access and manage your data on any device with a responsive and intuitive interface.

## 💻 Technologies Used

-   [Next.js](https://nextjs.org/): React framework for building performant web applications
-   [MongoDB](https://www.mongodb.com/): NoSQL database for storing your data
-   [NextAuth.js](https://next-auth.js.org/): Authentication library for secure user management
-   [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework for rapid UI development
-   [Radix UI](https://www.radix-ui.com/): Unstyled, accessible components for building beautiful UIs
-   [Recharts](https://recharts.org/): A composable charting library built on React components

## 🚀 Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```

2.  **Install dependencies:**

    ```bash
    cd inventory-quotation-portal
    pnpm install
    ```

3.  **Set up environment variables:**

    *   Create a `.env.local` file in the root directory.
    *   Add your MongoDB URI, NextAuth URL, and NextAuth secret:

        ```
        MONGODB_URI=your_mongodb_connection_string
        NEXTAUTH_URL=http://localhost:3000
        NEXTAUTH_SECRET=your_secret_key
        ```

4.  **Run the development server:**

    ```bash
    pnpm dev
    ```

5.  **Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.**

## ⚙️ Scripts

*   `dev`: Starts the development server.
*   `build`: Builds the application for production.
*   `start`: Starts the production server.
*   `lint`: Runs the linter.
*   `setup-database`: Seeds the database with initial data and users.
*   `seed-products`: Seeds the database with sample products.

## 🛡️ Security

This project uses NextAuth.js for authentication, ensuring secure user management. Passwords are encrypted using bcryptjs before storing them in the database.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Implement your changes and write tests.
4.  Submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/minhalawais/Quotation-Portal/blob/main/LICENSE.md) file for details.

## ✉️ Contact

For questions or feedback, please contact [minhalawais1@gmail.com](https://github.com/minhalawais/Quotation-Portal/blob/main/mailto:minhalawais1@gmail.com).

---

**Crafted with ❤️ by [Minhal Awais](https://www.linkedin.com/in/minhal-awais-601216227/)**
