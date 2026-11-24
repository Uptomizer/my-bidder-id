<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display listing of registered users.
     */
    public function index(Request $request): Response
    {
        $query = User::withCount(['bids', 'wonAuctions']);

        if ($request->filled('search')) {
            $search = '%' . $request->string('search')->toString() . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', $search)
                    ->orWhere('email', 'ilike', $search)
                    ->orWhere('phone', 'ilike', $search);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $users = $query->latest()->paginate(6)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }

    /**
     * Toggle user status between active and suspended.
     */
    public function toggleStatus(Request $request, int $id): RedirectResponse
    {
        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat mengubah status akun Anda sendiri.');
        }

        $newStatus = $targetUser->status === 'active' ? 'suspended' : 'active';
        $targetUser->update(['status' => $newStatus]);

        $message = $newStatus === 'suspended'
            ? 'Pengguna ' . $targetUser->name . ' berhasil disuspend/diblokir.'
            : 'Pengguna ' . $targetUser->name . ' berhasil diaktifkan kembali.';

        return back()->with('success', $message);
    }
}
