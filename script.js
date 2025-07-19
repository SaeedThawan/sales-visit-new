document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('visitForm');
  const submitBtn = document.getElementById('submitBtn');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');

  const salesRepSelect = document.getElementById('salesRepName');
  const customerNameInput = document.getElementById('customerName');
  const customerListDatalist = document.getElementById('customerList');
  const customerCodeInput = document.getElementById('customerCode');
  const visitTypeSelect = document.getElementById('visitType');
  const visitPurposeSelect = document.getElementById('visitPurpose');
  const visitOutcomeSelect = document.getElementById('visitOutcome');
  const visitDateInput = document.getElementById('visitDate');
  const visitTimeInput = document.getElementById('visitTime');
  const notesTextarea = document.getElementById('notes');
  const entryUserNameInput = document.getElementById('entryUserName');

  const productSelectionSection = document.getElementById('productSelectionSection');
  const productCategoriesDiv = document.getElementById('productCategories');
  const productsDisplayDiv = document.getElementById('productsDisplay');

  const inventorySection = document.getElementById('inventorySection');
  const inventoryProductNameInput = document.getElementById('inventoryProductName');
  const inventoryProductListDatalist = document.getElementById('inventoryProductList');
  const inventoryProductCodeInput = document.getElementById('inventoryProductCode');
  const inventoryCategoryInput = document.getElementById('inventoryCategory');
  const inventoryPackageTypeInput = document.getElementById('inventoryPackageType');
  const inventoryUnitSizeInput = document.getElementById('inventoryUnitSize');
  const inventoryUnitLabelInput = document.getElementById('inventoryUnitLabel');
  const inventoryQuantityInput = document.getElementById('inventoryQuantity');
  const inventoryExpirationDateInput = document.getElementById('inventoryExpirationDate');

  let salesReps = [];
  let customers = [];
  let visitTypes = [];
  let visitPurposes = [];
  let visitOutcomes = [];
  let products = [];
  let inventoryProducts = [];
  let selectedProducts = {};

  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec';

  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Could not fetch data from ${url}:`, error);
      Swal.fire({ icon: 'error', title: 'خطأ في التحميل', text: `تعذر تحميل البيانات من ${url}` });
      return [];
    }
  }

  async function loadAllData() {
    [salesReps, customers, visitTypes, visitPurposes, visitOutcomes, products, inventoryProducts] = await Promise.all([
      fetchData('sales_representatives.json'),
      fetchData('customers_main.json'),
      fetchData('visit_types.json'),
      fetchData('visit_purposes.json'),
      fetchData('visit_outcomes.json'),
      fetchData('products.json'),
      fetchData('inventory_products.json')
    ]);

    populateSalesReps();
    populateCustomers();
    populateVisitTypes();
    populateVisitPurposes();
    populateVisitOutcomes();
    populateProductCategories();
    populateInventoryProducts();
  }

  function populateSalesReps() {
    salesReps.forEach(rep => {
      const option = document.createElement('option');
      option.value = rep.Sales_Rep_Name_AR;
      option.textContent = rep.Sales_Rep_Name_AR;
      salesRepSelect.appendChild(option);
    });
  }

  function populateCustomers() {
    customerListDatalist.innerHTML = '';
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.Customer_Name_AR;
      customerListDatalist.appendChild(option);
    });
  }

  function populateVisitTypes() {
    visitTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.Visit_Type_Name_AR;
      option.textContent = type.Visit_Type_Name_AR;
      visitTypeSelect.appendChild(option);
    });
  }

  function populateVisitPurposes() {
    visitPurposes.forEach(purpose => {
      const option = document.createElement('option');
      option.value = purpose.Visit_Purpose_Name_AR;
      option.textContent = purpose.Visit_Purpose_Name_AR;
      visitPurposeSelect.appendChild(option);
    });
  }

  function populateVisitOutcomes() {
    visitOutcomes.forEach(outcome => {
      const option = document.createElement('option');
      option.value = outcome.Visit_Outcome_Name_AR;
      option.textContent = outcome.Visit_Outcome_Name_AR;
      visitOutcomeSelect.appendChild(option);
    });
  }

  function populateProductCategories() {
    productCategoriesDiv.innerHTML = '';
    const categories = [...new Set(products.map(p => p.Category))];
    categories.forEach(category => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-btn px-4 py-2 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors';
      button.textContent = category;
      button.dataset.category = category;
      productCategoriesDiv.appendChild(button);
    });
  }

  function populateInventoryProducts() {
    inventoryProductListDatalist.innerHTML = '';
    inventoryProducts.forEach(product => {
      const option = document.createElement('option');
      option.value = product.Product_Name_AR;
      inventoryProductListDatalist.appendChild(option);
    });
  }

  // ✅ نهاية المرحلة الأولى - التحميل والتعبئة
  // ✅ تحديث كود العميل عند اختيار اسم العميل
  customerNameInput.addEventListener('input', () => {
    const selectedCustomerName = customerNameInput.value;
    const customer = customers.find(c => c.Customer_Name_AR === selectedCustomerName);
    customerCodeInput.value = customer ? customer.Customer_Code : '';
  });

  // ✅ إظهار/إخفاء أقسام المنتجات حسب نوع الزيارة
  visitTypeSelect.addEventListener('change', () => {
    const selectedVisitType = visitTypeSelect.value;
    if (selectedVisitType === 'جرد استثنائي') {
      productSelectionSection.style.display = 'none';
      inventorySection.style.display = 'block';
      productsDisplayDiv.innerHTML = '';
      selectedProducts = {};
    } else {
      productSelectionSection.style.display = 'block';
      inventorySection.style.display = 'none';
      clearInventoryFields();
    }
  });

  function clearInventoryFields() {
    inventoryProductNameInput.value = '';
    inventoryProductCodeInput.value = '';
    inventoryCategoryInput.value = '';
    inventoryPackageTypeInput.value = '';
    inventoryUnitSizeInput.value = '';
    inventoryUnitLabelInput.value = '';
    inventoryQuantityInput.value = '';
    inventoryExpirationDateInput.value = '';
  }

  // ✅ تعبئة تفاصيل المنتج بمجرد اختياره في قسم الجرد
  inventoryProductNameInput.addEventListener('input', () => {
    const selectedProductName = inventoryProductNameInput.value;
    const product = inventoryProducts.find(p => p.Product_Name_AR === selectedProductName);
    if (product) {
      inventoryProductCodeInput.value = product.Product_Code || '';
      inventoryCategoryInput.value = product.Category || '';
      inventoryPackageTypeInput.value = product.Package_Type || '';
      inventoryUnitSizeInput.value = product.Unit_Size || '';
      inventoryUnitLabelInput.value = product.Unit_Label || '';
    } else {
      clearInventoryFields();
      inventoryProductNameInput.value = selectedProductName;
    }
  });

  // ✅ عرض المنتجات حسب التصنيف
  productCategoriesDiv.addEventListener('click', (event) => {
    if (event.target.classList.contains('category-btn')) {
      const category = event.target.dataset.category;
      displayProductsByCategory(category);
    }
  });

  function displayProductsByCategory(category) {
    productsDisplayDiv.innerHTML = '';
    const filteredProducts = products.filter(p => p.Category === category);

    filteredProducts.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = 'product-item p-4 border rounded-md flex items-center justify-between';
      productDiv.innerHTML = `
        <span class="font-medium">${product.Product_Name_AR}</span>
        <div class="flex items-center space-x-2 space-x-reverse">
          <input type="checkbox" id="product-${product.Product_Code}" value="${product.Product_Name_AR}" data-code="${product.Product_Code}" class="product-checkbox form-checkbox h-5 w-5 text-blue-600 rounded" ${selectedProducts[product.Product_Code] ? 'checked' : ''}>
          <label for="product-${product.Product_Code}" class="text-gray-700">متوفر</label>
        </div>
      `;
      productsDisplayDiv.appendChild(productDiv);

      const checkbox = productDiv.querySelector(`#product-${product.Product_Code}`);
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedProducts[product.Product_Code] = product.Product_Name_AR;
        } else {
          delete selectedProducts[product.Product_Code];
        }
      });
    });
  }

  // ✅ نهاية المرحلة الثانية - الأحداث ومعالجة الجرد
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }

      data.Timestamp = new Date().toLocaleString('ar-SA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }).replace(/\u200F/g, '');

      data.Customer_Type = ''; // عدّل إذا أضفت الحقل فعليًا للواجهة

      if (data.Visit_Type_Name_AR === 'جرد استثنائي') {
        data.Inventory_ID = `INVENTORY-${Date.now()}`;
        data.Product_Name_AR = inventoryProductNameInput.value;
        data.Product_Code = inventoryProductCodeInput.value;
        data.Quantity = inventoryQuantityInput.value;
        data.Expiration_Date = inventoryExpirationDateInput.value;
        data.Category = inventoryCategoryInput.value;
        data.Package_Type = inventoryPackageTypeInput.value;
        data.Unit_Size = inventoryUnitSizeInput.value;
        data.Unit_Label = inventoryUnitLabelInput.value;
        data.Customer_Code = customerCodeInput.value;

        delete data.Visit_ID;
        delete data.Visit_Purpose;
        delete data.Visit_Outcome;
        delete data.Available_Products_Names;
        delete data.Unavailable_Products_Names;
      } else {
        data.Visit_ID = `VISIT-${Date.now()}`;
        const allProducts = products.map(p => p.Product_Code);
        const availableProductCodes = Object.keys(selectedProducts);
        const unavailableProductCodes = allProducts.filter(code => !availableProductCodes.includes(code));

        data.Available_Products_Names = availableProductCodes.map(code => {
          const product = products.find(p => p.Product_Code === code);
          return product ? product.Product_Name_AR : '';
        }).filter(name => name !== '').join(', ');

        data.Unavailable_Products_Names = unavailableProductCodes.map(code => {
          const product = products.find(p => p.Product_Code === code);
          return product ? product.Product_Name_AR : '';
        }).filter(name => name !== '').join(', ');

        delete data.Inventory_ID;
        delete data.Product_Name_AR;
        delete data.Product_Code;
        delete data.Quantity;
        delete data.Expiration_Date;
        delete data.Category;
        delete data.Package_Type;
        delete data.Unit_Size;
        delete data.Unit_Label;
      }

      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({ icon: 'success', title: 'تم الإرسال بنجاح!', text: 'تم تسجيل البيانات بنجاح.' });
        form.reset();
        customerCodeInput.value = '';
        clearInventoryFields();
        productsDisplayDiv.innerHTML = '';
        selectedProducts = {};
        productSelectionSection.style.display = 'block';
        inventorySection.style.display = 'none';
        visitTypeSelect.value = '';
      } else {
        throw new Error(result.error || 'خطأ غير معروف في الخادم.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Swal.fire({ icon: 'error', title: 'خطأ في الإرسال!', text: `حدث خطأ أثناء إرسال البيانات: ${error.message}` });
    } finally {
      buttonText.style.display = 'inline-block';
      loadingSpinner.style.display = 'none';
      submitBtn.disabled = false;
    }
  });

  // ✅ التهيئة النهائية عند تحميل الصفحة
  loadAllData();
  const now = new Date();
  visitDateInput.value = now.toISOString().split('T')[0];
  visitTimeInput.value = now.toTimeString().split(' ')[0].substring(0, 5);
});
