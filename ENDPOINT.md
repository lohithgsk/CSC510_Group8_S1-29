 ### 1. REST API Endpoints

  #### Express.js Backend Server (http://localhost:5000)

  • POST /login – Authenticates customer/restaurant users
  (server.js:85)
  • POST /register – Registers a new customer account (server.js:126)
  • GET / – Health check endpoint (server.js:182)
  • POST /checkout – Processes cart items, validates inventory, and
  saves order (cart.js:93)
  • GET /dashboard/restaurants-with-meals – Returns restaurants
  joined with available rescue meals and updated inventory
  (dashboard.js:151)
  • GET /dashboard/community-stats – Returns aggregated community
  metrics and top user leaderboards (dashboard.js:264)
  • GET /dashboard/user-impact?email=... – Returns personal
  environmental impact statistics for a given user email
  (dashboard.js:358)
  • GET /api/restaurant-points – Returns restaurant points
  leaderboard (dashboard.js:429)
  • GET /restaurants – Returns basic restaurant metadata list from
  CSV (home.js:12)
  • GET /impact – Returns overall waste & active user impact stats
  from CSV (home.js:28)
  • GET /restaurant/menu?restaurant=... – Retrieves rescue meal menu
  for a specific restaurant (restaurant.js:140)
  • PATCH /restaurant/order-status – Updates order status (PENDING,
  READY, PICKED_UP, NO_SHOW) (restaurant.js:223)
  • GET /restaurant/overview?restaurant=... – Retrieves dashboard
  metrics and latest 10 orders for a restaurant (restaurant.js:274)
  • GET /reviews/:restaurantId – Returns reviews for a specific
  restaurant ID (reviews.js:42)
  • POST /reviews – Submits a customer review for a restaurant
  (reviews.js:60)

  #### Flask API Application (http://localhost:5000)

  • GET / – API summary root endpoint (app.py:104)
  • GET /api/health – Flask API health status (app.py:98)
  • GET /api/efficiency-waste-correlation – Returns correlation and
  regression analysis results (app.py:33)
  • GET /api/restaurant-points – Returns sorted restaurant points
  leaderboard (leaderboard_api.py:9)
  ──────
  ### 2. Python Public Functions

  • data_generator.py (data_generator.py)
      • generate_waste_data(n=250, start_date=...)
      • generate_restaurant_metadata()
      • generate_customer_feedback(n=200)
      • generate_menu_portions()
      • generate_delivery_logs(n=250)
      • main()
  • data_loader.py (data_loader.py)
      • load_csv(name)
      • basic_clean(df)
      • coerce_types(df)
      • integrate_all()
      • main()
  • delivery_metrics.py (delivery_metrics.py)
      • compute_delivery_metrics(input_file: str, output_file: str)
  • efficiency_scoring.py (efficiency_scoring.py)
      • compute_efficiency_scores(delivery_metrics_path,
      metadata_path, output_path)
  • correlate_efficiency_waste.py (correlate_efficiency_waste.py)
      • load_and_merge_data()
      • compute_correlations(df)
      • perform_regression_analysis(df)
      • get_correlation_summary(correlation_results)
      • main()
  • efficiency_waste_viz.py (efficiency_waste_viz.py)
      • create_scatter_plots(df, output_dir=OUTPUT_DIR)
      • create_correlation_heatmap(df, output_dir=OUTPUT_DIR)
      • create_efficiency_waste_comparison(df, output_dir=OUTPUT_DIR)
      • generate_all_visualizations()
  • api/app.py (app.py)
      • efficiency_waste_correlation()
      • health_check()
      • index()

  ──────
  ### 3. Frontend Service Functions

  • src/frontend/src/services/reviews.js (reviews.js)
      • fetchReviews(restaurantId)
      • submitReview(restaurantId, { rating, comment, user })

  ──────
  ### 4. Application Commands / Scripts

  • Backend Commands (package.json:6-10):
      • npm start – Starts Node.js backend server (server.js)
      • npm test – Runs Jest unit test suite with coverage
      • npm run test:coverage – Generates text, LCOV, and JSON test
      coverage reports
  • Frontend Commands (package.json:22-28):
      • npm start – Starts React development server
      • npm run build – Compiles production build bundle
      • npm test – Runs React unit tests using React Testing Library
      and Jest
      • npm run test:coverage – Runs tests and generates frontend
      coverage report
      • npm run eject – Ejects React scripts configuration