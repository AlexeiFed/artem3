"use client";

interface ConsentRow {
  id: string;
  name: string;
  phone: string;
  serviceName: string | null;
  situation: string | null;
  isDataAgreed: boolean;
  consentAt: string;
  createdAt: string;
}

interface ConsentsPanelProps {
  initialItems: ConsentRow[];
  loadError: string | null;
}

function formatSource(serviceName: string | null): string {
  return serviceName?.trim() || "—";
}

export function ConsentsPanel({
  initialItems,
  loadError,
}: ConsentsPanelProps) {
  return (
    <>
      <p className="mb-6 max-w-3xl font-sans text-sm text-secondary">
        Заявки с отмеченным согласием на обработку персональных данных. В колонке
        «Источник» — услуга или точка входа (например, «Главный экран»).
      </p>
      {loadError ? (
        <p className="text-sm text-secondary" role="alert">
          {loadError}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-sage/40 text-secondary">
              <th className="px-3 py-3 font-medium">Дата согласия</th>
              <th className="px-3 py-3 font-medium">Имя</th>
              <th className="px-3 py-3 font-medium">Телефон</th>
              <th className="px-3 py-3 font-medium">Источник</th>
              <th className="px-3 py-3 font-medium">Ситуация</th>
              <th className="px-3 py-3 font-medium">ПДн</th>
            </tr>
          </thead>
          <tbody>
            {initialItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-secondary">
                  Пока нет заявок с отмеченным согласием.
                </td>
              </tr>
            ) : (
              initialItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-sage/20 align-top"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-secondary">
                    {new Date(item.consentAt).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-3 py-3 text-primary">{item.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-primary">
                    {item.phone}
                  </td>
                  <td className="px-3 py-3 text-secondary">
                    {formatSource(item.serviceName)}
                  </td>
                  <td className="max-w-xs px-3 py-3 text-secondary">
                    {item.situation?.trim() ? item.situation : "—"}
                  </td>
                  <td className="px-3 py-3 text-primary">
                    {item.isDataAgreed ? "Да" : "Нет"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
