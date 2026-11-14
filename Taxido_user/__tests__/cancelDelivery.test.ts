import { cancelDelivery } from '../src/api/services/allRideService';
import { GET_API, PUT_API } from '../src/api/methods';

jest.mock('../src/api/methods', () => ({
  GET_API: jest.fn(), PUT_API: jest.fn(), POST_API: jest.fn(),
}));
const put = PUT_API as jest.Mock;
const get = GET_API as jest.Mock;
beforeEach(() => jest.resetAllMocks());

it('does not send a cancellation without a reason', async () => {
  await expect(cancelDelivery(42, '  ')).rejects.toThrow('reason');
  expect(put).not.toHaveBeenCalled();
});

it('sends the real reason without inventing distance or end time', async () => {
  put.mockResolvedValue({ status: 200, data: { id: 42, ride_status: { slug: 'cancelled' } } });
  await expect(cancelDelivery(42, ' Plans changed ')).resolves.toMatchObject({ id: 42 });
  expect(put).toHaveBeenCalledWith('ride/42', {
    status: 'cancelled', cancellation_reason: 'Plans changed',
  }, { timeout: 15000 });
  expect(get).not.toHaveBeenCalled();
});

it('keeps server rejection visible when the delivery remains active', async () => {
  put.mockResolvedValue({ status: 422, data: { message: 'Delivery already started' } });
  get.mockResolvedValue({ status: 200, data: { ride_status: { slug: 'started' } } });
  await expect(cancelDelivery(42, 'Changed plans')).rejects.toThrow('Delivery already started');
});

it('recognizes a committed cancellation after a lost response', async () => {
  put.mockResolvedValue(new Error('Request timed out'));
  get.mockResolvedValue({ status: 200, data: { id: 42, ride_status: { slug: 'cancelled' } } });
  await expect(cancelDelivery(42, 'Changed plans')).resolves.toMatchObject({ id: 42 });
  expect(put).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledTimes(1);
});

it('does not claim cancellation when neither request confirms it', async () => {
  put.mockRejectedValue(new Error('Network unavailable'));
  get.mockRejectedValue(new Error('Network unavailable'));
  await expect(cancelDelivery(42, 'Changed plans')).rejects.toThrow('Network unavailable');
});

it('requires cancelled server status even on HTTP 200', async () => {
  put.mockResolvedValue({ status: 200, data: { ride_status: { slug: 'accepted' } } });
  get.mockResolvedValue({ status: 200, data: { ride_status: { slug: 'accepted' } } });
  await expect(cancelDelivery(42, 'Changed plans')).rejects.toThrow('not confirmed');
});
