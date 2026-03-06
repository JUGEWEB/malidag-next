// next-sitemap.config.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import clientPromise from "./lib/mongodb.js";

/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: "https://web.malidag.com",
  generateRobotsTxt: true,
  sitemapSize: 5000,

  async additionalPaths() {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const products = await db.collection("products").find({}).toArray();

    // Generate /product/[id]
    const productPaths = products
      .filter((p) => p.id)
      .map((p) => ({
        loc: `/product/${encodeURIComponent(p.id)}`,
        changefreq: "daily",
        priority: 0.8,
      }));

    // Generate /product/[id]/review
    const reviewPaths = products
      .filter((p) => p.id)
      .map((p) => ({
        loc: `/product/${encodeURIComponent(p.id)}/review`,
        changefreq: "weekly",
        priority: 0.6,
      }));

 // ✅ Generate /coin/[symbol]
    const supportedCoins = ["usdt", "eth", "usdc", "sol", "bnb"];
    const coinPaths = supportedCoins.map((symbol) => ({
      loc: `/coin/${symbol}`,
      changefreq: "daily",
      priority: 0.7,
    }));

 // ✅ Generate /beauty/top/[type]
    const beautyTypes = ["skincare", "makeup", "facial-care"];
    const beautyPaths = beautyTypes.map((type) => ({
      loc: `/beauty/top/${encodeURIComponent(type)}`,
      changefreq: "weekly",
      priority: 0.6,
    }));

// ✅ /item-of-men/[itemClicked] 
    //    (take only products with genre=men and category=clothes/clothing)
    const menTypes = [
      ...new Set(
        products
          .filter(
            (p) =>
              p.item?.genre?.toLowerCase() === "men" &&
              ["clothes", "clothing"].includes(
                (p.category || "").toLowerCase()
              )
          )
          .map((p) => p.item?.type) // itemClicked is "type"
          .filter(Boolean)
      ),
    ];

    const menPaths = menTypes.map((type) => ({
      loc: `/item-of-men/${encodeURIComponent(type)}`,
      changefreq: "weekly",
      priority: 0.7,
    }));

// ✅ /item-of-women/[itemClicked]
    const womenTypes = [
      ...new Set(
        products
          .filter(
            (p) =>
              p.item?.genre?.toLowerCase() === "women" &&
              ["clothes", "clothing"].includes((p.category || "").toLowerCase())
          )
          .map((p) => p.item?.type)
          .filter(Boolean)
      ),
    ];

    const womenPaths = womenTypes.map((type) => ({
      loc: `/item-of-women/${encodeURIComponent(type)}`,
      changefreq: "weekly",
      priority: 0.7,
    }));

// ✅ /item-of-electronic/[itemClicked]
    const electronicTypes = [
      ...new Set(
        products
          .filter(
            (p) =>
              ["electronics", "electronic",  "gadgets", "devices"].includes(
                (p.category || "").toLowerCase()
              )
          )
          .map((p) => p.item?.type)
          .filter(Boolean)
      ),
    ];

    const electronicPaths = electronicTypes.map((type) => ({
      loc: `/itemOfElectronic/${encodeURIComponent(type)}`,
      changefreq: "weekly",
      priority: 0.7,
    }));

// ✅ /itemOfHome?itemClicked=[type]
//    (take products where category is home/kitchen related)
const homeTypes = [
  ...new Set(
    products
      .filter((p) => {
        const cat = (p.category || "").toLowerCase();
        return [
          "home",
          "kitchen",
          "home & kitchen",
          "home and kitchen",
          "appliance",
          "appliances",
          "cookware",
          "bakeware",
          "furniture",
          "decor",
        ].some((k) => cat.includes(k));
      })
      .map((p) => p.item?.type)
      .filter(Boolean)
  ),
];

const homePaths = homeTypes.map((type) => ({
  // keep your current query param route:
  loc: `/itemOfHome?itemClicked=${encodeURIComponent(type)}`,
  changefreq: "weekly",
  priority: 0.7,
}));

// ✅ /itemOfItems/[itemClicked]
// Only products where category is beauty-related
const beautyCategories = ["beauty", "skincare", "makeup", "cosmetics", "personal care"];

const itemOfItemsTypes = [
  ...new Set(
    products
      .filter((p) => {
        const cat = (p.category || "").toLowerCase();
        return beautyCategories.some((k) => cat.includes(k));
      })
      .map((p) => p.item?.type)
      .filter(Boolean)
  ),
];

const itemOfItemsPaths = itemOfItemsTypes.map((type) => ({
  loc: `/itemOfItems/${encodeURIComponent(type)}`,
  changefreq: "weekly",
  priority: 0.75,
}));

// ✅ /itemOfKids/[gender]/[type]
// Only include products where genre = kids/boys/girls
const kidsPairs = [
  ...new Set(
    products
      .filter((p) => {
        const g = (p.item?.genre || "").toLowerCase();
        return ["kids", "boys", "girls", "baby", "babies", "baby-girl", "baby-boy"].includes(g);
      })
      .map((p) => {
        const gender = (p.item?.genre || "kids").toLowerCase();
        const type = p.item?.type;
        return gender && type ? `${gender}::${type}` : null;
      })
      .filter(Boolean)
  ),
];

const itemOfKidsPaths = kidsPairs.map((pair) => {
  const [gender, type] = pair.split("::");
  return {
    loc: `/itemOfKids/${encodeURIComponent(gender)}/${encodeURIComponent(type)}`,
    changefreq: "weekly",
    priority: 0.7,
  };
});

// ✅ /itemOfShoes/[itemClicked]
// Collect unique shoe "type" values across all genders, based on category hints
const shoeCategoryHints = ["shoes", "shoe", "footwear"];

const itemOfShoesTypes = [
  ...new Set(
    products
      .filter((p) => {
        const cat = (p.category || "").toLowerCase();
        return shoeCategoryHints.some((k) => cat.includes(k));
      })
      .map((p) => p.item?.type)
      .filter(Boolean)
  ),
];

const itemOfShoesPaths = itemOfShoesTypes.map((type) => ({
  loc: `/itemOfShoes/${encodeURIComponent(type)}`,
  changefreq: "weekly",
  priority: 0.72,
}));

// ✅ /itemPage/[itemName]
function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "+");
}

const MAX_NAME_LENGTH = 80;

const itemPagePaths = [
  ...new Set(
    products
      .map((p) => p.item?.name?.toLowerCase())
      .filter(
        (name) =>
          name &&
          name.length > 2 &&
          name.length <= MAX_NAME_LENGTH
      )
  ),
].map((name) => ({
  loc: `/itemPage/${encodeURIComponent(normalizeName(name))}`,
  changefreq: "weekly",
  priority: 0.65,
}));

// ✅ /petcare/[gender]/[type]
// Only include products where category is petcare / pets
const petPairs = [
  ...new Set(
    products
      .filter((p) => {
        const cat = (p.category || "").toLowerCase();
        return ["pet", "pets", "petcare", "pet care"].some((k) =>
          cat.includes(k)
        );
      })
      .map((p) => {
        const gender = (p.item?.genre || "pets").toLowerCase(); // ex: dog, cat, etc.
        const type = p.item?.type;
        return gender && type ? `${gender}::${type}` : null;
      })
      .filter(Boolean)
  ),
];

const petCarePaths = petPairs.map((pair) => {
  const [gender, type] = pair.split("::");
  return {
    loc: `/petCare/${encodeURIComponent(gender)}/${encodeURIComponent(type)}`,
    changefreq: "weekly",
    priority: 0.7,
  };
});

// ✅ /shoesTopTopic/[type]/[genre]
const shoesPairs = [
  ...new Set(
    products
      .filter((p) => {
        const cat = (p.category || "").toLowerCase();
        return ["shoes", "shoe", "footwear"].some((k) => cat.includes(k));
      })
      .map((p) => {
        const type = p.item?.type;
        const genre = (p.item?.genre || "general").toLowerCase();
        return type && genre ? `${type}::${genre}` : null;
      })
      .filter(Boolean)
  ),
];

const shoesTopTopicPaths = shoesPairs.map((pair) => {
  const [type, genre] = pair.split("::");
  return {
    loc: `/shoesTopTopic/${encodeURIComponent(type)}/${encodeURIComponent(genre)}`,
    changefreq: "weekly",
    priority: 0.7,
  };
});

// ✅ /women-toptopic/[type]
// Only include women products where sold >= 100
const womenTopTopicTypes = [
  ...new Set(
    products
      .filter(
        (p) =>
          (p.item?.genre || "").toLowerCase() === "women" &&
          ["clothes", "clothing", "fashion"].includes(
            (p.category || "").toLowerCase()
          ) &&
          p.item?.sold >= 100 // ✅ only top-selling items
      )
      .map((p) => p.item?.type)
      .filter(Boolean)
  ),
];

const womenTopTopicPaths = womenTopTopicTypes.map((type) => ({
  loc: `/women-toptopic/${encodeURIComponent(type)}`,
  changefreq: "weekly",
  priority: 0.7,
}));

 // ✅ Fetch brand themes from your API
    let brandThemes = [];
    try {
      const res = await fetch("https://api.malidag.com/api/brands/themes");
      brandThemes = await res.json();
    } catch (err) {
      console.error("Failed to fetch brand themes:", err);
    }

    // ✅ Generate /brand/[themeRoute]/[brandName]
    const brandPaths = brandThemes
      .filter((b) => b.brandName && b.theme)
      .map((b) => ({
        loc: `/brand/${encodeURIComponent(b.theme)}/${encodeURIComponent(
          b.brandName
        )}`,
        changefreq: "weekly",
        priority: 0.75,
      }));

    const staticPaths = [
        { loc: "/", changefreq: "daily", priority: 1.0 }, // ✅ Homepage
         { loc: "/vault", changefreq: "daily", priority: 0.9 }, // ✅ Vault Presale page
      { loc: "/fashionPage", changefreq: "weekly", priority: 0.6 },
       { loc: "/fashionkick", changefreq: "weekly", priority: 0.6 }, // ✅ Fashion Kick
      { loc: "/electronic", changefreq: "weekly", priority: 0.6 },
	 { loc: "/buyBNB", changefreq: "weekly", priority: 0.8 }, // ✅ BNB discount page
	{ loc: "/women-fashion", changefreq: "weekly", priority: 0.7 }, // ✅ Women's Fashion (NEW)
	{ loc: "/type-page", changefreq: "weekly", priority: 0.7 }, // ✅ New Crypto Type Page (NEW)
	{ loc: "/kid-fashion", changefreq: "weekly", priority: 0.7 }, // ✅ Kids’ Fashion page
	 { loc: "/the-crypto-shop", changefreq: "daily", priority: 0.85 }, // ✅ The Crypto Shop (NEW)
	{ loc: "/payBNBBTCETH", changefreq: "weekly", priority: 0.8 }, // ✅ BNB/BTC/ETH discount page
	{ loc: "/save-big", changefreq: "weekly", priority: 0.8 }, // ✅ Save Big discounts
	{ loc: "/beauty", changefreq: "weekly", priority: 0.7 }, // ✅ Beauty page
	 { loc: "/men-fashion", changefreq: "weekly", priority: 0.7 }, // ✅ Men’s Fashion page
	{ loc: "/itemHome", changefreq: "weekly", priority: 0.7 }, // ✅ Home & Kitchen page
	{ loc: "/kid-toy", changefreq: "weekly", priority: 0.7 }, // ✅ Kids’ Toys page
	{ loc: "/international-shipping", changefreq: "monthly", priority: 0.5 }, // ✅ International shipping
    ];

    return [...productPaths, ...womenTopTopicPaths, ...shoesTopTopicPaths, ...itemPagePaths, ...petCarePaths,  ...itemOfShoesPaths, ...itemOfItemsPaths, ...homePaths, ...beautyPaths, ...itemOfKidsPaths, ...menPaths, ...womenPaths, ...electronicPaths, ...reviewPaths, ...coinPaths, ...staticPaths, ...brandPaths];
  },
};
