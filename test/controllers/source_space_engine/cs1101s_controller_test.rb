require 'test_helper'

module SourceSpaceEngine
  class Cs1101sControllerTest < ActionController::TestCase
    setup do
      @cs1101 = source_space_engine_cs1101s(:one)
      @routes = Engine.routes
    end

    test "should get index" do
      get :index
      assert_response :success
      assert_not_nil assigns(:cs1101s)
    end

    test "should get new" do
      get :new
      assert_response :success
    end

    test "should create cs1101" do
      assert_difference('Cs1101.count') do
        post :create, cs1101: {  }
      end

      assert_redirected_to cs1101_path(assigns(:cs1101))
    end

    test "should show cs1101" do
      get :show, id: @cs1101
      assert_response :success
    end

    test "should get edit" do
      get :edit, id: @cs1101
      assert_response :success
    end

    test "should update cs1101" do
      patch :update, id: @cs1101, cs1101: {  }
      assert_redirected_to cs1101_path(assigns(:cs1101))
    end

    test "should destroy cs1101" do
      assert_difference('Cs1101.count', -1) do
        delete :destroy, id: @cs1101
      end

      assert_redirected_to cs1101s_path
    end
  end
end
