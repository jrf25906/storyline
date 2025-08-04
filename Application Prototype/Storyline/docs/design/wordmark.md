# Storyline Wordmark Typography Specifications

**Complete guidelines for logo + text combinations**

---

## 🎯 Typography Foundation

### **Primary Wordmark Font**
**Inter Semibold (Weight: 600)**
- **Rationale**: Matches established UI typography system
- **Character**: Clean, modern, highly legible, professional
- **Relationship**: Complements feather icon without competing

### **Text Treatment**
- **Case**: "Storyline" (sentence case)
- **Kerning**: Optical spacing with slight tightening
- **Character Style**: Clean, unmodified letterforms

---

## 📐 Layout Specifications

### **1. Primary Horizontal Layout**
```
🪶  Storyline
```

#### Proportions
- **Icon Height**: 100% (baseline)
- **Text Height**: 85% of icon height
- **Spacing**: Icon width × 0.5 between icon and text
- **Vertical Alignment**: Text baseline aligned to icon's bottom 25%

#### Technical Specs
```css
/* If icon height = 48px */
font-family: 'Inter', sans-serif;
font-weight: 600;
font-size: 40px;
letter-spacing: -0.02em;
color: #1B1C1E;
```

### **2. Stacked Layout**
```
   🪶
Storyline
```

#### Proportions  
- **Icon Height**: 100% (baseline)
- **Text Height**: 40% of icon height
- **Vertical Spacing**: Icon height × 0.2 between elements
- **Horizontal Alignment**: Center-aligned

#### Technical Specs
```css
/* If icon height = 60px */
font-family: 'Inter', sans-serif;
font-weight: 600;
font-size: 24px;
letter-spacing: -0.01em;
color: #1B1C1E;
```

### **3. Compact Horizontal**
*(For business cards, small applications)*
```
🪶 Storyline
```

#### Proportions
- **Icon Height**: 100% (baseline)
- **Text Height**: 75% of icon height  
- **Spacing**: Icon width × 0.3 between icon and text
- **Usage**: Minimum 20px total height

---

## 🎨 Color Variations

### **Primary (Recommended)**
- **Icon**: Full color (Ink Black + Warm Ochre + Slate Gray)
- **Text**: Ink Black (#1B1C1E)
- **Usage**: Primary brand applications

### **Monochrome Dark**
- **Icon**: Ink Black (#1B1C1E) only
- **Text**: Ink Black (#1B1C1E)
- **Usage**: Single-color printing, embossing, minimal applications

### **Monochrome Light**  
- **Icon**: Parchment White (#FDFBF7)
- **Text**: Parchment White (#FDFBF7)
- **Usage**: Dark backgrounds, reverse applications

### **High Contrast**
- **Icon**: Full color
- **Text**: Deep Plum (#6B3FA0)
- **Usage**: When extra distinction needed

---

## 📱 Size Guidelines

### **Digital Applications**

| Usage | Icon Height | Text Size | Total Width (approx) |
|-------|-------------|-----------|---------------------|
| **Website Header** | 40px | 34px | 180px |
| **App Loading Screen** | 80px | 68px | 360px |
| **Email Signature** | 24px | 20px | 108px |
| **Social Media Profile** | 60px | 51px | 270px |
| **Business Card** | 20px | 17px | 90px |

### **Print Applications**

| Usage | Icon Height | Text Size | Total Width (approx) |
|-------|-------------|-----------|---------------------|
| **Letterhead** | 0.6" | 0.5" | 2.7" |
| **Business Card** | 0.3" | 0.25" | 1.35" |
| **Brochure Header** | 1.0" | 0.85" | 4.5" |
| **Billboard** | 24" | 20" | 108" |

---

## 📏 Clear Space Requirements

### **Minimum Clear Space**
- **All Sides**: Logo height × 0.5
- **Preferred**: Logo height × 1.0

### **Clear Space Calculation**
```
If total logo height = 48px
Minimum clear space = 24px on all sides
Preferred clear space = 48px on all sides
```

---

## 🎯 Usage Guidelines

### **Primary Applications (Horizontal Layout)**
- Website headers and navigation
- Email signatures  
- Business cards (landscape)
- Marketing materials
- App store listings

### **Secondary Applications (Stacked Layout)**  
- Social media profile pictures
- App splash screens
- Business cards (portrait)
- Square format requirements

### **Icon-Only Applications**
- App icons
- Favicons
- Very small spaces (under 60px total width)
- Watermarks

---

## 🚫 Don'ts - Typography

### **Never Do:**
- ❌ Use different fonts (stick to Inter Semibold)
- ❌ Stretch or distort the text
- ❌ Use all caps: "STORYLINE"
- ❌ Use different weights in same application
- ❌ Add drop shadows or effects to text
- ❌ Place text too close to icon (minimum spacing rules)
- ❌ Use different colors for different letters
- ❌ Rotate or angle the text

### **Avoid:**
- ⚠️ Text smaller than 12px in digital applications
- ⚠️ Text smaller than 8pt in print applications  
- ⚠️ High contrast backgrounds that reduce readability
- ⚠️ Placing logo over busy background images

---

## 🔧 Implementation Notes

### **Font Loading**
```css
/* Web implementation */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap');

.storyline-wordmark {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1B1C1E;
}
```

### **Fallback Fonts**
If Inter is unavailable:
1. **Primary Fallback**: -apple-system, BlinkMacSystemFont
2. **Secondary Fallback**: "Helvetica Neue", Helvetica
3. **Final Fallback**: Arial, sans-serif

### **Print Specifications**
- **Font**: Inter Semibold (embed fonts in files)
- **Color Mode**: CMYK
- **Resolution**: 300 DPI minimum
- **File Format**: Vector (AI, EPS) or high-res PNG

---

## 📊 Quality Checklist

### **Before Finalizing Any Wordmark:**
- [ ] Text is Inter Semibold, weight 600
- [ ] Letter spacing is optically balanced
- [ ] Proportions match specifications
- [ ] Clear space is maintained
- [ ] Colors match brand palette exactly
- [ ] Logo scales clearly to minimum size
- [ ] Text remains readable in monochrome
- [ ] Alignment is precise and consistent

### **File Delivery Requirements**
- [ ] SVG with embedded fonts
- [ ] PNG at multiple sizes (transparent background)
- [ ] AI/EPS source files with outlined fonts
- [ ] Style guide documentation
- [ ] Usage examples for different contexts

---

## 🎨 Next Steps for Design Creation

### **Recommended Design Process:**
1. **Create horizontal version first** (primary use case)
2. **Test at minimum sizes** (24px height) 
3. **Develop stacked version** for square applications
4. **Create monochrome versions** for single-color use
5. **Test across different backgrounds** and contexts
6. **Generate file variations** (SVG, PNG, AI)

### **Design Tool Settings:**
```
Font: Inter Semibold
Weight: 600
Size: Based on icon proportions (see size chart above)
Letter Spacing: -20 (in most design tools)
Color: #1B1C1E
Alignment: Baseline to icon specifications
```

---

**These specifications ensure your wordmark maintains the sophisticated, literary feel of your feather icon while providing maximum versatility across all brand applications.**