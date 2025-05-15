<template>
  <div class="reports-container">
    <h1 class="title">Reportistica Vendite</h1>
    
    <div class="filters-container">
      <div class="filter-group">
        <label for="report-type">Tipo di Report:</label>
        <select id="report-type" v-model="reportType" @change="loadReportData">
          <option value="prodotti">Vendite per Prodotto</option>
          <option value="vendite">Vendite per Periodo</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="timeframe">Periodo:</label>
        <select id="timeframe" v-model="timeframe" @change="loadReportData">
          <option value="day">Giornaliero</option>
          <option value="week">Settimanale</option>
          <option value="month">Mensile</option>
          <option value="year">Annuale</option>
          <option value="all">Tutto</option>
        </select>
      </div>

      <div class="filter-group" v-if="timeframe !== 'all'">
        <label for="year">Anno:</label>
        <select id="year" v-model="year" @change="loadReportData">
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <div class="filter-group" v-if="timeframe === 'day'">
        <label for="month">Mese:</label>
        <select id="month" v-model="month" @change="loadReportData">
          <option v-for="(name, index) in months" :key="index" :value="index + 1">{{ name }}</option>
        </select>
      </div>
    </div>

    <div class="report-content">
      <div class="chart-container">
        <div v-if="loading" class="loading">Caricamento dei dati...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="!hasData" class="no-data">Nessun dato disponibile per il periodo selezionato.</div>
        <canvas v-else ref="chartCanvas"></canvas>
      </div>
      
      <div class="export-container">
        <h2>Esporta Report</h2>
        <div class="summary-card" v-if="hasData">
          <h3>Riepilogo</h3>
          <div class="summary-item" v-if="reportType === 'prodotti'">
            <span>Totale Prodotti:</span> <strong>{{ reportData.summary?.totalProducts || 0 }}</strong>
          </div>
          <div class="summary-item" v-if="reportType === 'prodotti'">
            <span>Quantità Venduta:</span> <strong>{{ reportData.summary?.totalQuantitySold || 0 }}</strong>
          </div>
          <div class="summary-item" v-if="reportType === 'vendite'">
            <span>Totale Ordini:</span> <strong>{{ reportData.summary?.totalOrders || 0 }}</strong>
          </div>
          <div class="summary-item" v-if="reportType === 'vendite'">
            <span>Quantità Prodotti:</span> <strong>{{ reportData.summary?.totalQuantity || 0 }}</strong>
          </div>
          <div class="summary-item">
            <span>Valore Totale:</span> <strong>{{ formatCurrency(reportData.summary?.totalValue || 0) }}</strong>
          </div>
        </div>
        
        <div class="button-group">
          <button 
            class="btn btn-primary" 
            @click="downloadPDF" 
            :disabled="!hasData || loading">
            Esporta in PDF
          </button>
          <button 
            class="btn btn-secondary" 
            @click="downloadCSV" 
            :disabled="!hasData || loading">
            Esporta in CSV
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

// Use dynamic imports for Chart.js to avoid bundling issues
let Chart;

export default {
  name: 'ReportsView',
  setup() {
    const chartCanvas = ref(null);
    const chart = ref(null);
    const reportData = ref({});
    const loading = ref(false);
    const error = ref(null);
    
    // Report configuration
    const reportType = ref('prodotti');
    const timeframe = ref('month');
    const year = ref(new Date().getFullYear());
    const month = ref(new Date().getMonth() + 1);
    
    // Reference data
    const availableYears = ref([]);
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    // Initialize available years (current year and 4 previous years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      availableYears.value.push(currentYear - i);
    }

    const hasData = computed(() => {
      if (!reportData.value) return false;
      
      return reportType.value === 'prodotti' 
        ? reportData.value.products?.length > 0
        : reportData.value.salesData?.length > 0;
    });

    // Load the Chart.js dynamically
    const loadChartJS = async () => {
      if (!Chart) {
        try {
          //const module = await import('chart.js/auto');
          Chart = module.default;
        } catch (error) {
          console.error('Failed to load Chart.js:', error);
        }
      }
    };
    
    // Format currency
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    };

    // API request to get report data
    const loadReportData = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // Get authentication token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          error.value = "Utente non autenticato. Effettua il login.";
          loading.value = false;
          return;
        }
        
        // Build query parameters
        let params = {};
        if (timeframe.value !== 'all') {
          params.year = year.value;
        }
        if (timeframe.value === 'day') {
          params.month = month.value;
        }
        
        // API endpoint
        const endpoint = `/api/reports/${reportType.value}/vendite/${timeframe.value}`;
        
        const response = await axios.get(endpoint, {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        reportData.value = response.data;
        renderChart();
      } catch (err) {
        console.error('Error fetching report data:', err);
        error.value = err.response?.data?.error || 'Si è verificato un errore durante il caricamento dei dati.';
      } finally {
        loading.value = false;
      }
    };

    // Render the chart based on data
    const renderChart = async () => {
      if (!hasData.value) return;
      await loadChartJS();
      
      // Destroy previous chart if exists
      if (chart.value) {
        chart.value.destroy();
      }
      
      // Create the chart
      const ctx = chartCanvas.value.getContext('2d');
      
      let chartData = {};
      let chartOptions = {};
      
      if (reportType.value === 'prodotti') {
        // Chart for product sales
        const products = reportData.value.products.slice(0, 15); // Limit to top 15 products
        
        chartData = {
          labels: products.map(p => p.nome),
          datasets: [
            {
              label: 'Quantità Venduta',
              data: products.map(p => p.quantita_venduta),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Valore Totale (€)',
              data: products.map(p => p.valore_totale),
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              yAxisID: 'y1'
            }
          ]
        };
        
        chartOptions = {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Quantità'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Valore (€)'
              },
              grid: {
                drawOnChartArea: false
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        };
      } else {
        // Chart for time-based sales
        const sales = reportData.value.salesData;
        
        chartData = {
          labels: sales.map(s => s.periodo_nome),
          datasets: [
            {
              label: 'Numero Ordini',
              data: sales.map(s => s.numero_ordini),
              backgroundColor: 'rgba(255, 206, 86, 0.5)',
              borderColor: 'rgba(255, 206, 86, 1)',
              borderWidth: 1,
              type: 'bar'
            },
            {
              label: 'Valore Totale (€)',
              data: sales.map(s => s.valore_totale),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        };
        
        chartOptions = {
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Numero Ordini'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Valore (€)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        };
      }
      
      chart.value = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
      });
    };

    // Download data as PDF
    const downloadPDF = async () => {
      if (!hasData.value) return;
      
      // Dynamically import the library
      //const { default: jsPDF } = await import('jspdf');
      
      try {
        const doc = new jsPDF();
        
        // Add title
        const title = `Report ${reportType.value === 'prodotti' ? 'Prodotti' : 'Vendite'} - ${timeframe.value}`;
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')}`, 14, 30);
        
        // Add filters info
        doc.text(`Periodo: ${timeframe.value}`, 14, 40);
        if (timeframe.value !== 'all') {
          doc.text(`Anno: ${year.value}`, 14, 50);
        }
        if (timeframe.value === 'day') {
          doc.text(`Mese: ${months[month.value - 1]}`, 14, 60);
        }
        
        // Add summary
        doc.setFontSize(14);
        doc.text('Riepilogo', 14, 70);
        
        doc.setFontSize(12);
        let yPos = 80;
        
        if (reportType.value === 'prodotti') {
          doc.text(`Totale Prodotti: ${reportData.value.summary?.totalProducts || 0}`, 14, yPos);
          yPos += 10;
          doc.text(`Quantità Venduta: ${reportData.value.summary?.totalQuantitySold || 0}`, 14, yPos);
        } else {
          doc.text(`Totale Ordini: ${reportData.value.summary?.totalOrders || 0}`, 14, yPos);
          yPos += 10;
          doc.text(`Quantità Prodotti: ${reportData.value.summary?.totalQuantity || 0}`, 14, yPos);
        }
        
        yPos += 10;
        doc.text(`Valore Totale: ${formatCurrency(reportData.value.summary?.totalValue || 0)}`, 14, yPos);
        
        // Add chart
        if (chart.value) {
          yPos += 20;
          const chartImg = chart.value.toBase64Image();
          doc.addImage(chartImg, 'PNG', 14, yPos, 180, 100);
        }
        
        // Save the PDF
        doc.save(`report_${reportType.value}_${timeframe.value}_${new Date().getTime()}.pdf`);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Si è verificato un errore durante la generazione del PDF.');
      }
    };

    // Download data as CSV
    const downloadCSV = async () => {
      if (!hasData.value) return;
      
      try {
        // Dynamically import libraries
        // const { unparse } = await import('papaparse');
        // const { saveAs } = await import('file-saver');
        
        let csvData = [];
        
        if (reportType.value === 'prodotti') {
          // Headers for product report
          const headers = ['ID', 'Nome', 'Prezzo', 'Gestione', 'Quantità Venduta', 'Valore Totale'];
          
          // Data rows
          csvData = reportData.value.products.map(product => [
            product.idProdotto,
            product.nome,
            product.prezzo,
            product.gestione,
            product.quantita_venduta,
            product.valore_totale
          ]);
          
          // Insert headers at the beginning
          csvData.unshift(headers);
        } else {
          // Headers for sales report
          const headers = ['Periodo', 'Numero Ordini', 'Quantità Prodotti', 'Valore Totale'];
          
          // Data rows
          csvData = reportData.value.salesData.map(sale => [
            sale.periodo_nome,
            sale.numero_ordini,
            sale.quantita_prodotti,
            sale.valore_totale
          ]);
          
          // Insert headers at the beginning
          csvData.unshift(headers);
        }
        
        // Convert to CSV
        const csv = unparse(csvData);
        
        // Create a blob and save
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `report_${reportType.value}_${timeframe.value}_${new Date().getTime()}.csv`);
        
      } catch (error) {
        console.error('Error generating CSV:', error);
        alert('Si è verificato un errore durante la generazione del CSV.');
      }
    };

    // Load data on component mount
    onMounted(() => {
      loadReportData();
    });

    // Watch for changes to report configuration
    watch([reportType, timeframe, year, month], () => {
      loadReportData();
    });

    return {
      chartCanvas,
      reportType,
      timeframe,
      year,
      month,
      reportData,
      loading,
      error,
      hasData,
      availableYears,
      months,
      formatCurrency,
      loadReportData,
      downloadPDF,
      downloadCSV
    };
  }
};
</script>

<style scoped>
.reports-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--poldo-text);
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--poldo-card-bg);
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.filter-group label {
  margin-bottom: 5px;
  font-weight: 500;
}

.filter-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.report-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.chart-container {
  flex: 1;
  min-width: 300px;
  height: 400px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  position: relative;
  background-color: white;
}

.export-container {
  width: 300px;
  padding: 15px;
  border-radius: 8px;
  background-color: var(--poldo-card-bg);
}

.summary-card {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.summary-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}

.btn {
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #0b7dda;
}

.loading, .error, .no-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.error {
  color: #d32f2f;
}

.no-data {
  color: #666;
}

@media (max-width: 768px) {
  .report-content {
    flex-direction: column;
  }
  
  .export-container {
    width: 100%;
  }
  
  .chart-container {
    width: 100%;
  }
}
</style>