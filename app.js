let currentUser = null;
let transactions = [];
let chartInstance = null;

const CATEGORIAS = {
    ingreso: ['💰 Sueldo / Nómina', '🚀 Freelance / Proyectos', '📈 Inversiones', '🛍️ Ventas', '🎁 Otros Ingresos'],
    gasto: ['🏠 Servicios / Hogar', '🍔 Alimentación', '🚗 Transporte', '💊 Salud / Medicina', '🎉 Entretenimiento', '📚 Educación', '🛍️ Compras', '💸 Otros Gastos']
};

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('finance_user');
    if (savedUser) {
        setUser(savedUser);
    }
});

function loginUser() {
    const input = document.getElementById('username-input');
    if (!input) return;
    const username = input.value.trim();
    if (username) {
        localStorage.setItem('finance_user', username);
        setUser(username);
    }
}

function setUser(username) {
    currentUser = username;
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) userDisplay.innerHTML = `<i class="fa-solid fa-user"></i> ${currentUser}`;
    
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    
    updateCategories();
    loadTransactions();
}

function logout() {
    localStorage.removeItem('finance_user');
    location.reload();
}

function updateCategories() {
    const typeElem = document.getElementById('type');
    const catSelect = document.getElementById('category');
    if (!typeElem || !catSelect) return;
    
    const type = typeElem.value;
    catSelect.innerHTML = CATEGORIAS[type].map(c => `<option value="${c}">${c}</option>`).join('');
}

function loadTransactions() {
    const data = localStorage.getItem(`finance_data_${currentUser}`);
    transactions = data ? JSON.parse(data) : [];
    render();
}

function saveTransactions() {
    localStorage.setItem(`finance_data_${currentUser}`, JSON.stringify(transactions));
    render();
}

function addTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;

    if (!amount || isNaN(amount)) return;

    const newTrans = {
        id: Date.now(),
        date: new Date().toLocaleDateString('es-ES'),
        type,
        amount,
        category,
        description
    };

    transactions.unshift(newTrans);
    saveTransactions();
    document.getElementById('trans-form').reset();
    updateCategories();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
}

function render() {
    const list = document.getElementById('transactions-list');
    if (!list) return;
    
    list.innerHTML = '';

    let totalInc = 0;
    let totalExp = 0;
    const categoryTotals = {};

    transactions.forEach(t => {
        if (t.type === 'ingreso') {
            totalInc += t.amount;
        } else {
            totalExp += t.amount;
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td><span class="${t.type === 'ingreso' ? 'badge-income' : 'badge-expense'}">${t.type.toUpperCase()}</span></td>
            <td>$${t.amount.toLocaleString('es-CO')}</td>
            <td><button class="btn-delete" onclick="deleteTransaction(${t.id})"><i class="fa-solid fa-trash"></i></button></td>
        `;
        list.appendChild(row);
    });

    const balance = totalInc - totalExp;
    document.getElementById('total-balance').innerText = `$${balance.toLocaleString('es-CO')}`;
    document.getElementById('total-income').innerText = `+$${totalInc.toLocaleString('es-CO')}`;
    document.getElementById('total-expense').innerText = `-$${totalExp.toLocaleString('es-CO')}`;

    renderChart(categoryTotals);
}

function renderChart(categoryData) {
    const canvas = document.getElementById('expenseChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    const colors = ['#FF5E00', '#00FF87', '#00F2FE', '#A855F7', '#FF007F', '#FFB800', '#3B82F6', '#10B981'];

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sin gastos'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? colors.slice(0, data.length) : ['#1E293B'],
                borderWidth: 2,
                borderColor: '#070B14'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right',
                    labels: { 
                        color: '#94A3B8', 
                        font: { family: 'Plus Jakarta Sans', size: 10 },
                        boxWidth: 10
                    } 
                }
            }
        }
    });
}

function exportToCSV() {
    if (!transactions.length) return alert('No hay datos para exportar');
    
    let csv = 'Fecha,Tipo,Categoria,Descripcion,Monto\n';
    transactions.forEach(t => {
        csv += `"${t.date}","${t.type}","${t.category}","${t.description}",${t.amount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Finanzas_${currentUser}.csv`);
    a.click();
}




   


  

  

    

