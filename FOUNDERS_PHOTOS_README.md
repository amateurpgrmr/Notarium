# Founders Photos Setup

To complete the Founders feature, please add 5 founder photos to the `/public` directory.

## Required Photos

Add the following image files to `/public`:

1. `per.1.jpg` - Founder 1 photo
2. `per.2.jpg` - Founder 2 photo
3. `per.3.jpg` - Founder 3 photo
4. `per.4.jpg` - Founder 4 photo
5. `per.5.jpg` - Founder 5 photo

## Recommended Image Specifications

- Format: JPG or PNG
- Dimensions: Square aspect ratio (e.g., 500x500px or 1000x1000px)
- Size: Keep under 500KB for optimal performance
- Style: Professional headshots with good lighting

## Customizing Founder Information

After adding the photos, update the founder names and roles in:
`src/components/FoundersModal.tsx`

Edit the `founders` array (lines 13-19) with the actual founder information:

```typescript
const founders: Founder[] = [
  { name: 'Your Name', role: 'Your Role', photo: '/per.1.jpg' },
  { name: 'Name 2', role: 'Role 2', photo: '/per.2.jpg' },
  // ... etc
];
```

## How to Access

Users can click the "Meet the Founders" button in the footer to view the founders popup with photos and information.
