interface ScannedItemsListProps {
  items: string[];
}

const ScannedItemsList = ({ items }: ScannedItemsListProps) => {
  if (items.length === 0) {
    return <p>No items scanned yet</p>;
  }

  return (
    <div className="scanned-items">
      <h2>Scanned Items ({items.length})</h2>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <span className="barcode">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScannedItemsList;
