import { CategorySection } from './CategorySection';
import { LocationSection } from './LocationSection';

export function CategoryLocationManager() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategorySection />
      <LocationSection />
    </div>
  );
}
