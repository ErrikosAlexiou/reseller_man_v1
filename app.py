from flask import Flask, jsonify, render_template
import json

app = Flask(__name__)

# Route to serve the Dashboard page
@app.route('/')
def dashboard():
    return render_template('dashboard.html')

# Route to serve the Products page
@app.route('/products')
def products():
    return render_template('products.html')

# API route to get product data
@app.route('/api/products')
def get_products():
    with open('data.json', 'r') as f:
        products = json.load(f)
    return jsonify(products)

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=True)
