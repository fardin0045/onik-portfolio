import { useParams } from 'react-router';
import NotFound from '../../pages/NotFound.jsx';
import { ResourceManager } from '../components/ResourceManager.jsx';
import { RESOURCES } from '../resources.js';

/** /admin/:resource – every collection uses the same generic manager. */
export default function ResourcePage() {
  const { resource } = useParams();
  const config = Object.hasOwn(RESOURCES, resource) ? RESOURCES[resource] : null;
  if (!config) return <NotFound />;
  return <ResourceManager key={resource} resourceKey={resource} config={config} />;
}
