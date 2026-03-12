import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testSubcategories() {
  try {
    // 1. Get all categories to find a parent category
    console.log('Fetching categories...');
    const catRes = await axios.get(`${BASE_URL}/categories`);
    if (!catRes.data.success || catRes.data.data.length === 0) {
      console.log('No categories found.');
      return;
    }

    const category = catRes.data.data[0];
    const categoryId = category._id;
    const categorySlug = category.slug;

    console.log(`Testing with category: ${category.name} (${categoryId} / ${categorySlug})`);

    // 2. Test Admin Subcategories API with categoryId
    console.log('\nTesting Admin Subcategories API with ID...');
    const adminResId = await axios.get(`${BASE_URL}/admin/subcategories`, { params: { category: categoryId } });
    console.log(`Admin (ID) Success: ${adminResId.data.success}, Count: ${adminResId.data.data?.length || 0}`);

    // 3. Test Seller Subcategories API with Slug
    console.log('\nTesting Seller Subcategories API with Slug...');
    const sellerResSlug = await axios.get(`${BASE_URL}/categories/${categorySlug}/subcategories`);
    console.log(`Seller (Slug) Success: ${sellerResSlug.data.success}, Count: ${sellerResSlug.data.data?.length || 0}`);

    // 4. Test Seller Subcategories API with ID
    console.log('\nTesting Seller Subcategories API with ID...');
    const sellerResId = await axios.get(`${BASE_URL}/categories/${categoryId}/subcategories`);
    console.log(`Seller (ID) Success: ${sellerResId.data.success}, Count: ${sellerResId.data.data?.length || 0}`);

    // 5. Test All Subcategories
    console.log('\nTesting All Subcategories API...');
    const allRes = await axios.get(`${BASE_URL}/categories/subcategories/all`);
    console.log(`All Subs Success: ${allRes.data.success}, Count: ${allRes.data.data?.length || 0}`);

  } catch (error) {
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSubcategories();
