const timeRangeSelect = document.getElementById('timeRange');
const productFilterDropdown = document.getElementById('productFilterDropdown');
const productList = document.getElementById('productList');
const downloadButton = document.getElementById('downloadButton');
const totalRevenueElement = document.getElementById('totalRevenue');
const totalProfitElement = document.getElementById('totalProfit');
const totalExpensesElement = document.getElementById('totalExpenses');
const totalItemsSoldElement = document.getElementById('totalItemsSold');
const totalItemsBoughtElement = document.getElementById('totalItemsBought');
const averageOrderValueElement = document.getElementById('averageOrderValue');
const profitMarginElement = document.getElementById('profitMargin');

let data = JSON.parse(localStorage.getItem('resaleData'));
let currentData = data;

function populateProductFilterDropdown() {
    const products = data.products;
    const allLabel = productList.querySelector('label'); // Get the "All Products" label

    products.forEach(product => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = product.product_id;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(product.product_name));
        productList.appendChild(label);
    });

    // Add event listeners to the checkboxes
    const checkboxes = productList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleProductFilterChange);
    });

    // Event listener to toggle the dropdown
    productFilterDropdown.addEventListener('click', () => {
        productList.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!productFilterDropdown.contains(event.target) && !productList.contains(event.target)) {
            productList.classList.remove('open');
        }
    });
}

function updateDropdownButtonText() {
    const checkedBoxes = productList.querySelectorAll('input[type="checkbox"]:checked');
    const selectedProducts = Array.from(checkedBoxes)
        .filter(checkbox => checkbox.value !== 'all')
        .map(checkbox => {
            const label = checkbox.parentNode;
            return label.textContent.trim();
        });

    const allChecked = productList.querySelector('input[value="all"]').checked;

    if (allChecked || selectedProducts.length === 0) {
        productFilterDropdown.querySelector('span').textContent = 'All Products';
    } else if (selectedProducts.length <= 2) {
        productFilterDropdown.querySelector('span').textContent = selectedProducts.join(', ');
    } else {
        productFilterDropdown.querySelector('span').textContent = `${selectedProducts.length} products selected`;
    }
}

function handleProductFilterChange() {
    const allCheckbox = productList.querySelector('input[value="all"]');
    const otherCheckboxes = Array.from(productList.querySelectorAll('input[type="checkbox"]:not([value="all"])'));
    const anyOtherChecked = otherCheckboxes.some(checkbox => checkbox.checked);

    if (this.value === 'all') {
        otherCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    } else {
        allCheckbox.checked = false;
    }

    updateDropdownButtonText();
    updateDashboard();
}

function filterDataByTime(data, timeRange) {
    const now = new Date();
    let cutoff;

    switch (timeRange) {
        case '1':
            cutoff = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            break;
        case '7':
            cutoff = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            break;
        case '30':
            cutoff = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            break;
        case 'all':
        default:
            return data;
    }

    const filteredProducts = data.products.map(product => ({
        ...product,
        buy_transactions: product.buy_transactions.filter(t => new Date(t.date) >= cutoff),
        sell_transactions: product.sell_transactions.filter(t => new Date(t.date) >= cutoff),
    }));

    return { products: filteredProducts };
}

function filterDataByProducts(data, selectedProductIds) {
    if (selectedProductIds.includes('all')) {
        return data;
    }
    const filteredProducts = data.products.filter(product =>
        selectedProductIds.map(Number).includes(product.product_id)
    );
    return { products: filteredProducts };
}

function calculateDashboardStats(data) {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalExpenses = 0;
    let totalItemsSold = 0;
    let totalItemsBought = 0;
    let totalOrders = 0;

    data.products.forEach(product => {
        product.sell_transactions.forEach(sell => {
            totalRevenue += sell.quantity * sell.price;
            totalItemsSold += sell.quantity;
            totalExpenses += (sell.shipping_out || 0) + (sell.repacking || 0) + (sell.other || 0);
            totalOrders++;
            const costOfGoodsSold = product.buy_transactions.reduce((totalCost, buy) => {
                const boughtBeforeSell = new Date(buy.date) <= new Date(sell.date);
                return boughtBeforeSell ? totalCost + (buy.price / buy.quantity) : totalCost;
            }, 0) * sell.quantity;
            totalProfit += (sell.quantity * sell.price) - costOfGoodsSold - ((sell.shipping_out || 0) + (sell.repacking || 0) + (sell.other || 0));
        });
        product.buy_transactions.forEach(buy => {
            totalExpenses += (buy.quantity * buy.price) + (buy.shipping_in || 0) + (buy.taxes || 0) + (buy.other || 0);
            totalItemsBought += buy.quantity;
        });
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    totalRevenueElement.textContent = `£${totalRevenue.toFixed(2)}`;
    totalProfitElement.textContent = `£${totalProfit.toFixed(2)}`;
    totalExpensesElement.textContent = `£${totalExpenses.toFixed(2)}`;
    totalItemsSoldElement.textContent = totalItemsSold;
    totalItemsBoughtElement.textContent = totalItemsBought;
    averageOrderValueElement.textContent = `£${averageOrderValue.toFixed(2)}`;
    profitMarginElement.textContent = `${profitMargin.toFixed(2)}%`;
}

function updateDashboard() {
    const selectedTimeRange = timeRangeSelect.value;
    const checkedProductValues = Array.from(productList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    currentData = filterDataByTime(data, selectedTimeRange);
    currentData = filterDataByProducts(currentData, checkedProductValues);
    calculateDashboardStats(currentData);

    // ... inside updateDashboard() ...
    if (currentData) {
        // ... existing calculations ...
        renderRevenueChart(currentData);
        renderTopProductsChart(currentData);
        // ... other graph rendering functions ...
    }


}

if (data) {
    populateProductFilterDropdown();
    updateDropdownButtonText(); // Initial text update
    updateDashboard();
} else {
    window.location.href = '../html/index.html';
}

timeRangeSelect.addEventListener('change', updateDashboard);

downloadButton.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});


// dashboard.js

// ... existing JavaScript ...

function renderRevenueChart(data) {
    const revenueData = {};
    data.products.forEach(product => {
        product.sell_transactions.forEach(sell => {
            const date = sell.date; // You might want to group by day, week, or month
            revenueData[date] = (revenueData[date] || 0) + sell.quantity * sell.price;
        });
    });

    const sortedDates = Object.keys(revenueData).sort();
    const labels = sortedDates;
    const values = sortedDates.map(date => revenueData[date]);

    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: values,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (£)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
}

function renderTopProductsChart(data) {
    const productSales = {};
    data.products.forEach(product => {
        let totalSold = 0;
        product.sell_transactions.forEach(sell => {
            totalSold += sell.quantity;
        });
        if (totalSold > 0) {
            productSales[product.product_name] = totalSold;
        }
    });

    const sortedProducts = Object.keys(productSales).sort((a, b) => productSales[b] - productSales[a]).slice(0, 5); // Get top 5
    const labels = sortedProducts;
    const values = sortedProducts.map(product => productSales[product]);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
    ];
    const borderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
    ];

    const ctx = document.getElementById('topProductsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantity Sold',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantity Sold'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Product'
                    }
                }
            }
        }
    });
}



// Function to fetch and update data
function refreshData() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Update HTML elements with the new data
            document.getElementById('element1').textContent = data.element1Value;
            document.getElementById('element2').textContent = data.element2Value;
            // ... update other elements as needed
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Add event listener to the refresh button
document.getElementById('refreshButton').addEventListener('click', refreshData);

// Optionally, you can also load the data initially when the page loads:
refreshData();